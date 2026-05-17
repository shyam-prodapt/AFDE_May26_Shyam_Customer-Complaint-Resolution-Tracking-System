from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class Attachment(Base):
    __tablename__ = "attachments"

    attachment_id = Column(Integer, primary_key=True, index=True)
    complaint_id = Column(String(20), ForeignKey("complaints.complaint_id"), nullable=False)
    file_name = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    uploaded_by = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())

    complaint = relationship("Complaint", back_populates="attachments")
    uploaded_by_user = relationship("User", back_populates="attachments")
