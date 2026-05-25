from fastapi import APIRouter, Depends
from sqlalchemy import func, case
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, require_roles
from app.database import get_db
from app.models.analytics import AnalyticsComplaint
from app.models.user import User
from etl.etl_pipeline import run_pipeline

router = APIRouter(prefix="/api/analytics", tags=["Analytics"])

ANALYTICS_ROLES = ["Admin", "Supervisor", "Quality Team"]


@router.post("/run-etl")
def trigger_etl(
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(*ANALYTICS_ROLES)),
):
    result = run_pipeline(db)
    return {"status": "success", **result}


@router.get("/sla-report")
def sla_report(
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(*ANALYTICS_ROLES)),
):
    rows = (
        db.query(
            AnalyticsComplaint.priority,
            func.count().label("total"),
            func.sum(case((AnalyticsComplaint.sla_breached == True, 1), else_=0)).label("breached"),
        )
        .group_by(AnalyticsComplaint.priority)
        .all()
    )
    return [
        {
            "priority": r.priority,
            "total": r.total,
            "breached": int(r.breached or 0),
            "compliant": r.total - int(r.breached or 0),
            "breach_rate": round(int(r.breached or 0) / r.total * 100, 1) if r.total else 0,
        }
        for r in rows
    ]


@router.get("/category-analysis")
def category_analysis(
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(*ANALYTICS_ROLES)),
):
    rows = (
        db.query(
            AnalyticsComplaint.category,
            func.count().label("total"),
            func.sum(case((AnalyticsComplaint.sla_breached == True, 1), else_=0)).label("breached"),
            func.avg(AnalyticsComplaint.resolution_time_hours).label("avg_resolution_hours"),
        )
        .group_by(AnalyticsComplaint.category)
        .order_by(func.count().desc())
        .all()
    )
    return [
        {
            "category": r.category,
            "total": r.total,
            "breached": int(r.breached or 0),
            "avg_resolution_hours": round(float(r.avg_resolution_hours), 1) if r.avg_resolution_hours else None,
        }
        for r in rows
    ]


@router.get("/resolution-trends")
def resolution_trends(
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(*ANALYTICS_ROLES)),
):
    rows = (
        db.query(
            func.date_format(AnalyticsComplaint.created_date, "%Y-%m").label("month"),
            func.count().label("total"),
            func.sum(case((AnalyticsComplaint.status.in_(["Resolved", "Closed"]), 1), else_=0)).label("resolved"),
            func.avg(AnalyticsComplaint.resolution_time_hours).label("avg_resolution_hours"),
        )
        .filter(AnalyticsComplaint.created_date.isnot(None))
        .group_by(func.date_format(AnalyticsComplaint.created_date, "%Y-%m"))
        .order_by(func.date_format(AnalyticsComplaint.created_date, "%Y-%m"))
        .all()
    )
    return [
        {
            "month": r.month,
            "total": r.total,
            "resolved": int(r.resolved or 0),
            "avg_resolution_hours": round(float(r.avg_resolution_hours), 1) if r.avg_resolution_hours else None,
        }
        for r in rows
    ]


@router.get("/agent-performance")
def agent_performance(
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(*ANALYTICS_ROLES)),
):
    rows = (
        db.query(
            AnalyticsComplaint.assigned_agent,
            func.count().label("total_assigned"),
            func.sum(case((AnalyticsComplaint.status.in_(["Resolved", "Closed"]), 1), else_=0)).label("resolved"),
            func.sum(case((AnalyticsComplaint.sla_breached == True, 1), else_=0)).label("sla_breached"),
            func.avg(AnalyticsComplaint.resolution_time_hours).label("avg_resolution_hours"),
        )
        .group_by(AnalyticsComplaint.assigned_agent)
        .order_by(func.count().desc())
        .all()
    )
    return [
        {
            "agent": r.assigned_agent,
            "total_assigned": r.total_assigned,
            "resolved": int(r.resolved or 0),
            "sla_breached": int(r.sla_breached or 0),
            "avg_resolution_hours": round(float(r.avg_resolution_hours), 1) if r.avg_resolution_hours else None,
            "resolution_rate": round(int(r.resolved or 0) / r.total_assigned * 100, 1) if r.total_assigned else 0,
        }
        for r in rows
    ]


@router.get("/summary")
def summary(
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(*ANALYTICS_ROLES)),
):
    total     = db.query(func.count(AnalyticsComplaint.id)).scalar() or 0
    breached  = db.query(func.count(AnalyticsComplaint.id)).filter(AnalyticsComplaint.sla_breached == True).scalar() or 0
    resolved  = db.query(func.count(AnalyticsComplaint.id)).filter(AnalyticsComplaint.status.in_(["Resolved", "Closed"])).scalar() or 0
    avg_res   = db.query(func.avg(AnalyticsComplaint.resolution_time_hours)).scalar()
    return {
        "total_records": total,
        "sla_breached": breached,
        "sla_compliant": total - breached,
        "resolved": resolved,
        "breach_rate": round(breached / total * 100, 1) if total else 0,
        "avg_resolution_hours": round(float(avg_res), 1) if avg_res else None,
    }
