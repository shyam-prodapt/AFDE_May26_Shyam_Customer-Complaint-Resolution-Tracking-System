from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.database import get_db
from app.models.complaint import Complaint, ComplaintStatus
from app.models.feedback import Feedback
from app.models.user import User
from app.schemas.feedback import FeedbackCreate, FeedbackOut

router = APIRouter(prefix="/api/feedback", tags=["Feedback"])


@router.post("/{complaint_id}", response_model=FeedbackOut, status_code=status.HTTP_201_CREATED)
def submit_feedback(
    complaint_id: str,
    payload: FeedbackCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    complaint = db.query(Complaint).filter(Complaint.complaint_id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
    if complaint.customer_id != current_user.user_id:
        raise HTTPException(status_code=403, detail="Not your complaint")
    if complaint.status not in (ComplaintStatus.resolved, ComplaintStatus.closed):
        raise HTTPException(status_code=400, detail="Feedback only allowed on resolved or closed complaints")
    if db.query(Feedback).filter(Feedback.complaint_id == complaint_id).first():
        raise HTTPException(status_code=400, detail="Feedback already submitted")

    feedback = Feedback(
        complaint_id=complaint_id,
        customer_id=current_user.user_id,
        rating=payload.rating,
        comments=payload.comments,
    )
    db.add(feedback)
    db.commit()
    db.refresh(feedback)
    return feedback


@router.get("/{complaint_id}", response_model=FeedbackOut)
def get_feedback(
    complaint_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    feedback = db.query(Feedback).filter(Feedback.complaint_id == complaint_id).first()
    if not feedback:
        raise HTTPException(status_code=404, detail="No feedback found")
    return feedback
