from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text
from sqlalchemy.sql import func

from app.database import Base


class AnalyticsComplaint(Base):
    __tablename__ = "analytics_complaints"

    id                     = Column(Integer, primary_key=True, index=True)
    complaint_id           = Column(String(30), unique=True, index=True)
    customer_name          = Column(String(150))
    category               = Column(String(100), index=True)
    priority               = Column(String(20), index=True)
    status                 = Column(String(50), index=True)
    assigned_agent         = Column(String(150), index=True)
    created_date           = Column(DateTime)
    resolved_date          = Column(DateTime, nullable=True)
    resolution_time_hours  = Column(Float, nullable=True)
    sla_threshold_hours    = Column(Float)
    sla_breached           = Column(Boolean, default=False)
    description            = Column(Text, nullable=True)
    etl_loaded_at          = Column(DateTime(timezone=True), server_default=func.now())
