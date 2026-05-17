from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.complaint import Complaint, ComplaintStatus
from app.models.complaint_history import ComplaintHistory
from app.services.notification_service import create_notification
from app.services.sla_service import calculate_sla_due


def generate_complaint_id(db: Session) -> str:
    today = datetime.now(timezone.utc).strftime("%Y%m%d")
    prefix = f"COMP-{today}-"
    count = db.query(Complaint).filter(Complaint.complaint_id.like(f"{prefix}%")).count()
    return f"{prefix}{str(count + 1).zfill(4)}"


def create_complaint(db: Session, customer_id: int, category_id: int, description: str, priority) -> Complaint:
    complaint_id = generate_complaint_id(db)
    sla_due = calculate_sla_due(priority)

    complaint = Complaint(
        complaint_id=complaint_id,
        customer_id=customer_id,
        category_id=category_id,
        description=description,
        priority=priority,
        status=ComplaintStatus.open,
        sla_due_date=sla_due,
    )
    db.add(complaint)
    db.flush()

    _record_history(db, complaint_id, customer_id, None, ComplaintStatus.open, "Complaint registered")
    create_notification(db, customer_id, f"Your complaint {complaint_id} has been registered.", complaint_id)
    return complaint


def assign_complaint(db: Session, complaint: Complaint, agent_id: int, assigned_by_id: int) -> Complaint:
    old_status = complaint.status
    complaint.assigned_to = agent_id
    complaint.status = ComplaintStatus.assigned
    db.flush()

    _record_history(db, complaint.complaint_id, assigned_by_id, old_status, ComplaintStatus.assigned, f"Assigned to agent {agent_id}")
    create_notification(db, agent_id, f"Complaint {complaint.complaint_id} has been assigned to you.", complaint.complaint_id)
    create_notification(db, complaint.customer_id, f"Your complaint {complaint.complaint_id} has been assigned to an agent.", complaint.complaint_id)
    return complaint


def update_complaint_status(
    db: Session,
    complaint: Complaint,
    new_status: ComplaintStatus,
    updated_by_id: int,
    comment: str = None,
) -> Complaint:
    old_status = complaint.status
    complaint.status = new_status

    if new_status == ComplaintStatus.resolved:
        complaint.resolved_date = datetime.now(timezone.utc)

    db.flush()
    _record_history(db, complaint.complaint_id, updated_by_id, old_status, new_status, comment)
    create_notification(
        db,
        complaint.customer_id,
        f"Your complaint {complaint.complaint_id} status changed to '{new_status}'.",
        complaint.complaint_id,
    )
    return complaint


def _record_history(
    db: Session,
    complaint_id: str,
    updated_by: int,
    old_status,
    new_status,
    comment: str = None,
):
    old = old_status.value if old_status else None
    new = new_status.value if hasattr(new_status, "value") else str(new_status)
    entry = ComplaintHistory(
        complaint_id=complaint_id,
        updated_by=updated_by,
        old_status=old,
        new_status=new,
        comment=comment,
    )
    db.add(entry)
