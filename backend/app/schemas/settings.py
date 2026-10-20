from typing import Optional
from pydantic import BaseModel


class SystemSettingsResponse(BaseModel):
    project_name: str
    version: str
    copyright: str
    slogan: str
    auto_scan_enabled: bool
    scan_interval_minutes: int
    max_concurrent_workers: int
    request_timeout_seconds: int
    telegram_configured: bool
    telegram_chat_id: Optional[str] = None
    min_score_for_alert: int
    weight_value: float
    weight_reliability: float
    weight_applicability: float
    weight_urgency: float
    weight_confidence: float


class SystemSettingsUpdate(BaseModel):
    auto_scan_enabled: Optional[bool] = None
    scan_interval_minutes: Optional[int] = None
    max_concurrent_workers: Optional[int] = None
    request_timeout_seconds: Optional[int] = None
    telegram_bot_token: Optional[str] = None
    telegram_chat_id: Optional[str] = None
    min_score_for_alert: Optional[int] = None
    weight_value: Optional[float] = None
    weight_reliability: Optional[float] = None
    weight_applicability: Optional[float] = None
    weight_urgency: Optional[float] = None
    weight_confidence: Optional[float] = None
