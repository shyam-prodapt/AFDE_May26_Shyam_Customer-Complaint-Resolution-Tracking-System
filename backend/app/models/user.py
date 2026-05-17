from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class User(Base):
    __tablename__ = "users"

    user_id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, nullable=False, index=True)
    password = Column(String(255), nullable=False)
    role_id = Column(Integer, ForeignKey("roles.role_id"), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    role = relationship("Role", back_populates="users")
    complaints = relationship("Complaint", foreign_keys="Complaint.customer_id", back_populates="customer")
    assigned_complaints = relationship("Complaint", foreign_keys="Complaint.assigned_to", back_populates="agent")
    history_entries = relationship("ComplaintHistory", back_populates="updated_by_user")
    attachments = relationship("Attachment", back_populates="uploaded_by_user")
    feedbacks = relationship("Feedback", back_populates="customer")
    notifications = relationship("Notification", back_populates="user")