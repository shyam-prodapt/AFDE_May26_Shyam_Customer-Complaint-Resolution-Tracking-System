import csv
import os
from typing import List, Dict

DATASET_PATH = os.path.join(os.path.dirname(__file__), "dataset", "complaints_dataset.csv")


def extract() -> List[Dict]:
    if not os.path.exists(DATASET_PATH):
        raise FileNotFoundError(f"Dataset not found at {DATASET_PATH}")

    with open(DATASET_PATH, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        records = list(reader)

    print(f"[Extract] {len(records)} records read from CSV")
    return records
