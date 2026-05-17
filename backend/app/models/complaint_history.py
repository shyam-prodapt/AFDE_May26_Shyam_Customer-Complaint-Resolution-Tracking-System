from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class ComplaintHistory(Base):
    __tablename__ = "complaint_history"

    history_id = Column(Integer, primary_key=True, index=True)
    complaint_id = Column(String(20), ForeignKey("complaints.complaint_id"), nullable=False)
    updated_by = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    old_status = Column(String(50), nullable=True)
    new_status = Column(String(50), nullable=False)
    comment = Column(Text, nullable=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now())

    complaint = relationship("Complaint", back_populates="history")
    updated_by_user = relationship("User", back_populates="history_entries")