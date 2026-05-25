from datetime import datetime
from typing import List, Dict

SLA_HOURS = {"Low": 72, "Medium": 48, "High": 24, "Critical": 4}

PRIORITY_MAP = {
    "low": "Low", "medium": "Medium", "high": "High", "critical": "Critical"
}

STATUS_MAP = {
    "open": "Open", "assigned": "Assigned", "in progress": "In Progress",
    "pending customer response": "Pending Customer Response",
    "escalated": "Escalated", "resolved": "Resolved", "closed": "Closed",
}


def _parse_dt(val: str):
    if not val or not val.strip():
        return None
    for fmt in ("%Y-%m-%d %H:%M:%S", "%Y-%m-%d"):
        try:
            return datetime.strptime(val.strip(), fmt)
        except ValueError:
            continue
    return None


def transform(records: List[Dict]) -> List[Dict]:
    transformed = []
    skipped = 0

    for row in records:
        # Normalise priority / status
        priority = PRIORITY_MAP.get(row.get("priority", "").strip().lower(), row.get("priority", "Medium"))
        status   = STATUS_MAP.get(row.get("status", "").strip().lower(), row.get("status", "Open"))

        sla_threshold = SLA_HOURS.get(priority, 48)

        created_date  = _parse_dt(row.get("created_date", ""))
        resolved_date = _parse_dt(row.get("resolved_date", ""))

        if not created_date:
            skipped += 1
            continue

        # Recalculate resolution time from dates if available
        if resolved_date and created_date:
            res_hours = round((resolved_date - created_date).total_seconds() / 3600, 2)
        else:
            raw = row.get("resolution_time_hours", "").strip()
            res_hours = float(raw) if raw else None

        # SLA breach: resolved but took longer than threshold
        if res_hours is not None:
            sla_breached = res_hours > sla_threshold
        else:
            # Unresolved — check if already past SLA from created date
            from datetime import timezone
            now = datetime.now()
            elapsed = (now - created_date).total_seconds() / 3600
            sla_breached = (elapsed > sla_threshold) and status not in ("Resolved", "Closed")

        transformed.append({
            "complaint_id":          row.get("complaint_id", "").strip(),
            "customer_name":         row.get("customer_name", "").strip(),
            "category":              row.get("category", "").strip(),
            "priority":              priority,
            "status":                status,
            "assigned_agent":        row.get("assigned_agent", "").strip(),
            "created_date":          created_date,
            "resolved_date":         resolved_date,
            "resolution_time_hours": res_hours,
            "sla_threshold_hours":   sla_threshold,
            "sla_breached":          sla_breached,
            "description":           row.get("description", "").strip(),
        })

    print(f"[Transform] {len(transformed)} records transformed, {skipped} skipped")
    return transformed
