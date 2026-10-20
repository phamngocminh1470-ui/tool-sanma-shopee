from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel


class ConnectorResponse(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    endpoint_url: str
    connector_type: str
    is_enabled: bool
    status: str
    last_run_at: Optional[datetime] = None
    last_success_at: Optional[datetime] = None
    total_found: int
    new_records: int
    updated_records: int
    duplicates_count: int
    error_count: int
    avg_duration_ms: int
    last_error_message: Optional[str] = None
    config_data: str

    class Config:
        from_attributes = True


class ConnectorUpdate(BaseModel):
    name: Optional[str] = None
    endpoint_url: Optional[str] = None
    is_enabled: Optional[bool] = None
    config_data: Optional[str] = None


class ConnectorTestResult(BaseModel):
    id: str
    success: bool
    status: str
    message: str
    records_found: int
    duration_ms: int
