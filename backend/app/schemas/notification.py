from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class NotificationOut(BaseModel):
    notification_id: int
    complaint_id: Optional[str]
    message: str
    is_read: bool
    created_at: datetime

    model_config = {"from_attributes": True}
