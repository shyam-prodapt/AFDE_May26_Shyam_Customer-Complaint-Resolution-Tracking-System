"""
Run once after first startup to populate roles and default categories.
Usage: python seed.py
"""
from app.database import SessionLocal
from app.models.role import Role
from app.models.category import Category

db = SessionLocal()

roles = [
    (1, "Admin"),
    (2, "Support Agent"),
    (3, "Supervisor"),
    (4, "Customer"),
    (5, "Quality Team"),
]

for role_id, role_name in roles:
    if not db.query(Role).filter_by(role_id=role_id).first():
        db.add(Role(role_id=role_id, role_name=role_name))
        print(f"  + Role: {role_name}")
    else:
        print(f"  ✓ Role exists: {role_name}")

categories = [
    "Billing Issues",
    "Service Disruption",
    "Product Defects",
    "Technical Problems",
    "Delivery Delays",
    "Account Issues",
    "Customer Service Complaints",
]

for name in categories:
    if not db.query(Category).filter_by(category_name=name).first():
        db.add(Category(category_name=name))
        print(f"  + Category: {name}")
    else:
        print(f"  ✓ Category exists: {name}")

db.commit()
db.close()
print("\nSeeding complete.")
