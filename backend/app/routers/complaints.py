import os
import uuid
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session

from app.config import settings
from app.core.dependencies import get_current_user, require_roles
from app.database import get_db
from app.models.attachment import Attachment
from app.models.complaint import Complaint, ComplaintStatus
from app.models.complaint_history import ComplaintHistory
from app.models.user import User
from app.schemas.complaint import (
    ComplaintCreate,
    ComplaintAssign,
    ComplaintStatusUpdate,
    ComplaintOut,
    ComplaintListOut,
    ComplaintHistoryOut,
)
from app.services.complaint_service import (
    create_complaint,
    assign_complaint,
    update_complaint_status,
)

router = APIRouter(prefix="/api/complaints", tags=["Complaints"])


def _get_complaint_or_404(complaint_id: str, db: Session) -> Complaint:
    complaint = db.query(Complaint).filter(Complaint.complaint_id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
    return complaint


@router.post("/", response_model=ComplaintOut, status_code=status.HTTP_201_CREATED)
def register_complaint(
    payload: ComplaintCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    complaint = create_complaint(
        db,
        customer_id=current_user.user_id,
        category_id=payload.category_id,
        description=payload.description,
        priority=payload.priority,
    )
    db.commit()
    db.refresh(complaint)
    return complaint


@router.get("/", response_model=List[ComplaintListOut])
def list_complaints(
    status_filter: Optional[ComplaintStatus] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Complaint)
    role = current_user.role.role_name

    if role == "Customer":
        query = query.filter(Complaint.customer_id == current_user.user_id)
    elif role == "Support Agent":
        query = query.filter(Complaint.assigned_to == current_user.user_id)

    if status_filter:
        query = query.filter(Complaint.status == status_filter)

    return query.order_by(Complaint.created_at.desc()).all()


@router.get("/{complaint_id}", response_model=ComplaintOut)
def get_complaint(
    complaint_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    complaint = _get_complaint_or_404(complaint_id, db)
    role = current_user.role.role_name
    if role == "Customer" and complaint.customer_id != current_user.user_id:
        raise HTTPException(status_code=403, detail="Access denied")
    if role == "Support Agent" and complaint.assigned_to != current_user.user_id:
        raise HTTPException(status_code=403, detail="Access denied")
    return complaint


@router.post("/{complaint_id}/assign", response_model=ComplaintOut)
def assign(
    complaint_id: str,
    payload: ComplaintAssign,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("Admin", "Supervisor")),
):
    complaint = _get_complaint_or_404(complaint_id, db)
    agent = db.query(User).filter(User.user_id == payload.agent_id).first()
    if not agent or agent.role.role_name != "Support Agent":
        raise HTTPException(status_code=400, detail="Invalid agent")
    assign_complaint(db, complaint, payload.agent_id, current_user.user_id)
    db.commit()
    db.refresh(complaint)
    return complaint


@router.patch("/{complaint_id}/status", response_model=ComplaintOut)
def change_status(
    complaint_id: str,
    payload: ComplaintStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    complaint = _get_complaint_or_404(complaint_id, db)
    role = current_user.role.role_name

    if role == "Support Agent" and complaint.assigned_to != current_user.user_id:
        raise HTTPException(status_code=403, detail="Not your complaint")
    if role == "Customer" and payload.status not in (ComplaintStatus.closed,):
        raise HTTPException(status_code=403, detail="Customers can only close resolved complaints")

    update_complaint_status(db, complaint, payload.status, current_user.user_id, payload.comment)
    db.commit()
    db.refresh(complaint)
    return complaint


@router.get("/{complaint_id}/history", response_model=List[ComplaintHistoryOut])
def get_history(
    complaint_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    _get_complaint_or_404(complaint_id, db)
    return (
        db.query(ComplaintHistory)
        .filter(ComplaintHistory.complaint_id == complaint_id)
        .order_by(ComplaintHistory.updated_at.asc())
        .all()
    )


@router.post("/{complaint_id}/attachments", status_code=status.HTTP_201_CREATED)
async def upload_attachment(
    complaint_id: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    complaint = _get_complaint_or_404(complaint_id, db)

    max_bytes = settings.MAX_FILE_SIZE_MB * 1024 * 1024
    contents = await file.read()
    if len(contents) > max_bytes:
        raise HTTPException(status_code=400, detail=f"File exceeds {settings.MAX_FILE_SIZE_MB} MB limit")

    ext = os.path.splitext(file.filename)[1]
    stored_name = f"{uuid.uuid4().hex}{ext}"
    dest = os.path.join(settings.UPLOAD_DIR, complaint_id)
    os.makedirs(dest, exist_ok=True)
    file_path = os.path.join(dest, stored_name)

    with open(file_path, "wb") as f:
        f.write(contents)

    attachment = Attachment(
        complaint_id=complaint_id,
        file_name=file.filename,
        file_path=file_path,
        uploaded_by=current_user.user_id,
    )
    db.add(attachment)
    db.commit()
    return {"attachment_id": attachment.attachment_id, "file_name": file.filename}
