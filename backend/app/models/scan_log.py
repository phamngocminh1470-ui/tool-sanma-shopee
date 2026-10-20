from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Text
from app.database import Base


class ScanRunLog(Base):
    __tablename__ = "scan_run_logs"

    id = Column(Integer, primary_key=True, index=True)
    scan_id = Column(String(64), index=True, nullable=False)
    started_at = Column(DateTime, default=datetime.utcnow, index=True)
    finished_at = Column(DateTime, nullable=True)
    
    # Status: RUNNING, COMPLETED, FAILED, CANCELLED
    status = Column(String(50), default="RUNNING")
    trigger_type = Column(String(50), default="SCHEDULED")  # SCHEDULED, MANUAL, EVENT
    
    total_found = Column(Integer, default=0)
    new_records = Column(Integer, default=0)
    updated_records = Column(Integer, default=0)
    duplicates_count = Column(Integer, default=0)
    errors_count = Column(Integer, default=0)
    duration_ms = Column(Integer, default=0)
    
    summary = Column(Text, nullable=True)
    details_json = Column(Text, nullable=False, default="[]")
