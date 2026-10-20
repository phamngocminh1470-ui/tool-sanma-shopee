from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text
from app.database import Base


class SystemNotification(Base):
    __tablename__ = "system_notifications"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    type = Column(String(50), default="INFO")  # INFO, SUCCESS, WARNING, CRITICAL, VOUCHER_ALERT
    channel = Column(String(50), default="IN_APP")  # IN_APP, TELEGRAM, DESKTOP
    is_read = Column(Boolean, default=False, index=True)
    action_url = Column(Text, nullable=True)
    voucher_id = Column(Integer, nullable=True)
    metadata_json = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
