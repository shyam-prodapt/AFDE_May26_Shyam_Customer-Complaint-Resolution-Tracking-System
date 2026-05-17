from datetime import datetime
from typing import Optional, List

from pydantic import BaseModel

from app.models.complaint import Priority, ComplaintStatus
from app.schemas.category import CategoryOut
from app.schemas.user import UserOutSimple


class ComplaintCreate(BaseModel):
    category_id: int
    description: str
    priority: Priority = Priority.medium


class ComplaintAssign(BaseModel):
    agent_id: int


class ComplaintStatusUpdate(BaseModel):
    status: ComplaintStatus
    comment: Optional[str] = None


class ComplaintHistoryOut(BaseModel):
    history_id: int
    old_status: Optional[str]
    new_status: str
    comment: Optional[str]
    updated_at: datetime
    updated_by_user: UserOutSimple

    model_config = {"from_attributes": True}


class AttachmentOut(BaseModel):
    attachment_id: int
    file_name: str
    uploaded_at: datetime

    model_config = {"from_attributes": True}


class ComplaintOut(BaseModel):
    complaint_id: str
    description: str
    priority: Priority
    status: ComplaintStatus
    sla_due_date: Optional[datetime]
    resolved_date: Optional[datetime]
    created_at: datetime
    updated_at: Optional[datetime]
    customer: UserOutSimple
    agent: Optional[UserOutSimple]
    category: CategoryOut
    attachments: List[AttachmentOut] = []

    model_config = {"from_attributes": True}


class ComplaintListOut(BaseModel):
    complaint_id: str
    priority: Priority
    status: ComplaintStatus
    category: CategoryOut
    customer: UserOutSimple
    agent: Optional[UserOutSimple]
    sla_due_date: Optional[datetime]
    created_at: datetime

    model_config = {"from_attributes": True}
