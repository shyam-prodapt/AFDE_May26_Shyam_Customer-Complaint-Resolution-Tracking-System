from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, require_roles
from app.database import get_db
from app.models.complaint import Complaint, ComplaintStatus
from app.models.feedback import Feedback
from app.models.user import User
from app.services.sla_service import is_sla_breached

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])


@router.get("/stats")
def get_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("Admin", "Supervisor", "Quality Team")),
):
    total = db.query(Complaint).count()
    open_count = db.query(Complaint).filter(Complaint.status == ComplaintStatus.open).count()
    assigned_count = db.query(Complaint).filter(Complaint.status == ComplaintStatus.assigned).count()
    in_progress_count = db.query(Complaint).filter(Complaint.status == ComplaintStatus.in_progress).count()
    escalated_count = db.query(Complaint).filter(Complaint.status == ComplaintStatus.escalated).count()
    resolved_count = db.query(Complaint).filter(Complaint.status == ComplaintStatus.resolved).count()
    closed_count = db.query(Complaint).filter(Complaint.status == ComplaintStatus.closed).count()

    now = datetime.now(timezone.utc)
    sla_breaches = db.query(Complaint).filter(
        Complaint.sla_due_date < now,
        Complaint.status.notin_([ComplaintStatus.resolved, ComplaintStatus.closed]),
    ).count()

    avg_rating = db.query(func.avg(Feedback.rating)).scalar()

    return {
        "total": total,
        "open": open_count,
        "assigned": assigned_count,
        "in_progress": in_progress_count,
        "escalated": escalated_count,
        "resolved": resolved_count,
        "closed": closed_count,
        "sla_breaches": sla_breaches,
        "avg_customer_rating": round(float(avg_rating), 2) if avg_rating else None,
    }


@router.get("/agent-stats/{agent_id}")
def agent_stats(
    agent_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles("Admin", "Supervisor")),
):
    total = db.query(Complaint).filter(Complaint.assigned_to == agent_id).count()
    resolved = db.query(Complaint).filter(
        Complaint.assigned_to == agent_id,
        Complaint.status == ComplaintStatus.resolved,
    ).count()
    open_c = db.query(Complaint).filter(
        Complaint.assigned_to == agent_id,
        Complaint.status.notin_([ComplaintStatus.resolved, ComplaintStatus.closed]),
    ).count()

    return {"agent_id": agent_id, "total_assigned": total, "resolved": resolved, "open": open_c}


@router.get("/category-breakdown")
def category_breakdown(
    db: Session = Depends(get_db),
    _: User = Depends(require_roles("Admin", "Supervisor", "Quality Team")),
):
    rows = (
        db.query(Complaint.category_id, func.count(Complaint.complaint_id))
        .group_by(Complaint.category_id)
        .all()
    )
    return [{"category_id": r[0], "count": r[1]} for r in rows]
