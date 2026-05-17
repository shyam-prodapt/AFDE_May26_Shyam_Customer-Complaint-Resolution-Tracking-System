import enum

from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class Priority(str, enum.Enum):
    low = "Low"
    medium = "Medium"
    high = "High"
    critical = "Critical"


class ComplaintStatus(str, enum.Enum):
    open = "Open"
    assigned = "Assigned"
    in_progress = "In Progress"
    pending_customer = "Pending Customer Response"
    escalated = "Escalated"
    resolved = "Resolved"
    closed = "Closed"


class Complaint(Base):
    __tablename__ = "complaints"

    complaint_id = Column(String(20), primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    assigned_to = Column(Integer, ForeignKey("users.user_id"), nullable=True)
    category_id = Column(Integer, ForeignKey("categories.category_id"), nullable=False)
    description = Column(Text, nullable=False)
    priority = Column(Enum(Priority), nullable=False, default=Priority.medium)
    status = Column(Enum(ComplaintStatus), nullable=False, default=ComplaintStatus.open)
    sla_due_date = Column(DateTime(timezone=True), nullable=True)
    resolved_date = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    customer = relationship("User", foreign_keys=[customer_id], back_populates="complaints")
    agent = relationship("User", foreign_keys=[assigned_to], back_populates="assigned_complaints")
    category = relationship("Category", back_populates="complaints")
    history = relationship("ComplaintHistory", back_populates="complaint", cascade="all, delete-orphan")
    attachments = relationship("Attachment", back_populates="complaint", cascade="all, delete-orphan")
    feedback = relationship("Feedback", back_populates="complaint", uselist=False)
    notifications = relationship("Notification", back_populates="complaint")