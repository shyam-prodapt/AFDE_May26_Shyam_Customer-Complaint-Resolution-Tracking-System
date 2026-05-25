from sqlalchemy.orm import Session

from etl.extract import extract
from etl.transform import transform
from etl.load import load


def run_pipeline(db: Session) -> dict:
    print("[ETL] Starting pipeline...")
    raw        = extract()
    processed  = transform(raw)
    total      = load(processed, db)
    print(f"[ETL] Complete. {total} records in analytics table.")
    return {
        "extracted":  len(raw),
        "transformed": len(processed),
        "loaded":      total,
    }
