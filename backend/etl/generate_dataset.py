"""Run once to generate complaints_dataset.csv with 250 synthetic records."""
import csv, random
from datetime import datetime, timedelta

CATEGORIES = [
    "Billing Issues", "Service Disruption", "Product Defects",
    "Technical Problems", "Delivery Delays", "Account Issues",
    "Customer Service Complaints",
]
PRIORITIES = ["Low", "Medium", "High", "Critical"]
STATUSES   = ["Resolved", "Closed", "Escalated", "Open", "In Progress"]
AGENTS     = ["Alice Johnson", "Bob Smith", "Carol White", "David Lee",
               "Emma Davis", "Frank Miller", "Grace Wilson"]

SLA_HOURS  = {"Low": 72, "Medium": 48, "High": 24, "Critical": 4}

CUSTOMERS  = [f"Customer_{i:03d}" for i in range(1, 81)]

random.seed(42)

base = datetime(2025, 1, 1)
rows = []

for i in range(1, 251):
    cat      = random.choice(CATEGORIES)
    priority = random.choices(PRIORITIES, weights=[30, 40, 20, 10])[0]
    status   = random.choices(STATUSES,   weights=[40, 30, 10, 10, 10])[0]
    agent    = random.choice(AGENTS)
    customer = random.choice(CUSTOMERS)

    created  = base + timedelta(days=random.randint(0, 500),
                                hours=random.randint(0, 23),
                                minutes=random.randint(0, 59))

    sla_h    = SLA_HOURS[priority]
    # ~35% of records breach SLA deliberately
    breach   = random.random() < 0.35
    if status in ("Resolved", "Closed"):
        if breach:
            res_hours = round(sla_h * random.uniform(1.1, 3.0), 1)
        else:
            res_hours = round(sla_h * random.uniform(0.1, 0.95), 1)
        resolved = created + timedelta(hours=res_hours)
        resolved_str = resolved.strftime("%Y-%m-%d %H:%M:%S")
    else:
        res_hours    = ""
        resolved_str = ""

    date_str = created.strftime("%Y-%m-%d %H:%M:%S")
    cid      = f"COMP-{created.strftime('%Y%m%d')}-{i:04d}"

    rows.append({
        "complaint_id":          cid,
        "customer_name":         customer,
        "category":              cat,
        "priority":              priority,
        "status":                status,
        "assigned_agent":        agent,
        "created_date":          date_str,
        "resolved_date":         resolved_str,
        "resolution_time_hours": res_hours,
        "sla_threshold_hours":   sla_h,
        "description":           f"{cat} reported by {customer} with {priority} priority.",
    })

out = "etl/dataset/complaints_dataset.csv"
with open(out, "w", newline="", encoding="utf-8") as f:
    writer = csv.DictWriter(f, fieldnames=rows[0].keys())
    writer.writeheader()
    writer.writerows(rows)

print(f"Generated {len(rows)} records -> {out}")
