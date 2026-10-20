from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text
from app.database import Base


class ConnectorConfig(Base):
    __tablename__ = "connector_configs"

    id = Column(String(100), primary_key=True)
    name = Column(String(150), nullable=False)
    description = Column(Text, nullable=True)
    endpoint_url = Column(Text, nullable=False)
    connector_type = Column(String(50), nullable=False, default="PUBLIC_FEED")
    is_enabled = Column(Boolean, default=True)
    
    # Status: ACTIVE, DEGRADED, DISABLED, ERROR, NEEDS_CONFIGURATION
    status = Column(String(50), default="ACTIVE")
    
    last_run_at = Column(DateTime, nullable=True)
    last_success_at = Column(DateTime, nullable=True)
    total_found = Column(Integer, default=0)
    new_records = Column(Integer, default=0)
    updated_records = Column(Integer, default=0)
    duplicates_count = Column(Integer, default=0)
    error_count = Column(Integer, default=0)
    avg_duration_ms = Column(Integer, default=0)
    last_error_message = Column(Text, nullable=True)
    
    config_data = Column(Text, nullable=False, default="{}")  # JSON
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
