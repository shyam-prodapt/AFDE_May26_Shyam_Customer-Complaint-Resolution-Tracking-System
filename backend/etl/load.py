from typing import List, Dict
from sqlalchemy.orm import Session

from app.models.analytics import AnalyticsComplaint


def load(records: List[Dict], db: Session) -> int:
    existing_ids = {r[0] for r in db.query(AnalyticsComplaint.complaint_id).all()}

    new_rows = []
    updated  = 0

    for rec in records:
        cid = rec["complaint_id"]
        if cid in existing_ids:
            # Update existing row
            row = db.query(AnalyticsComplaint).filter_by(complaint_id=cid).first()
            for k, v in rec.items():
                setattr(row, k, v)
            updated += 1
        else:
            new_rows.append(AnalyticsComplaint(**rec))

    db.bulk_save_objects(new_rows)
    db.commit()

    inserted = len(new_rows)
    print(f"[Load] {inserted} inserted, {updated} updated")
    return inserted + updated
