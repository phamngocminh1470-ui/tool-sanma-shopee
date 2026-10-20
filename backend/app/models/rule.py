from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text
from app.database import Base


class AutomationRule(Base):
    __tablename__ = "automation_rules"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    priority = Column(Integer, default=0)
    
    # Event: ON_DISCOVERY, ON_UPDATE, ON_EXPIRATION_CHECK
    trigger_event = Column(String(50), default="ON_DISCOVERY")
    
    # Condition: MIN_SCORE, MIN_DISCOUNT_PERCENT, MAX_MIN_SPEND, CATEGORY_EQUALS, CODE_CONTAINS
    condition_type = Column(String(50), nullable=False)
    condition_value = Column(String(255), nullable=False)
    
    # Action: ADD_TAG, SEND_NOTIFICATION, MARK_VERIFIED, MARK_PRIORITY
    action_type = Column(String(50), nullable=False)
    action_payload = Column(String(255), nullable=True)
    
    execution_count = Column(Integer, default=0)
    last_triggered_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
