from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class RuleBase(BaseModel):
    name: str
    description: Optional[str] = None
    is_active: bool = True
    priority: int = 0
    trigger_event: str = "ON_DISCOVERY"
    condition_type: str
    condition_value: str
    action_type: str
    action_payload: Optional[str] = None


class RuleCreate(RuleBase):
    pass


class RuleUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None
    priority: Optional[int] = None
    condition_type: Optional[str] = None
    condition_value: Optional[str] = None
    action_type: Optional[str] = None
    action_payload: Optional[str] = None


class RuleResponse(RuleBase):
    id: int
    execution_count: int
    last_triggered_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True
