from sqlalchemy.orm import Session

from app.models.notification import Notification


def create_notification(db: Session, user_id: int, message: str, complaint_id: str = None) -> Notification:
    notif = Notification(
        user_id=user_id,
        complaint_id=complaint_id,
        message=message,
    )
    db.add(notif)
    db.flush()
    return notif
