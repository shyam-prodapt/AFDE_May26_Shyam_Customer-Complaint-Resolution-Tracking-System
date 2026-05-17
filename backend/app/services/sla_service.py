from datetime import datetime, timedelta, timezone

from app.models.complaint import Priority

SLA_HOURS = {
    Priority.low: 72,
    Priority.medium: 48,
    Priority.high: 24,
    Priority.critical: 4,
}


def calculate_sla_due(priority: Priority) -> datetime:
    hours = SLA_HOURS[priority]
    return datetime.now(timezone.utc) + timedelta(hours=hours)


def is_sla_breached(sla_due_date: datetime) -> bool:
    if sla_due_date is None:
        return False
    return datetime.now(timezone.utc) > sla_due_date
