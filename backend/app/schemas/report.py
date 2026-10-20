from typing import List, Dict, Any, Optional
from pydantic import BaseModel


class CategoryMetric(BaseModel):
    category: str
    count: int
    avg_score: float


class TierMetric(BaseModel):
    tier: str
    count: int


class ConnectorMetric(BaseModel):
    id: str
    name: str
    status: str
    total_found: int
    new_records: int
    error_count: int


class DashboardSummaryResponse(BaseModel):
    total_vouchers: int
    new_24h: int
    verified_count: int
    unverified_count: int
    expiring_soon_count: int
    archived_count: int
    avg_voucher_score: float
    active_connectors: int
    total_connectors: int
    last_scan_time: Optional[str] = None
    next_scan_time: Optional[str] = None
    scheduler_running: bool
    categories: List[CategoryMetric]
    tiers: List[TierMetric]
    connectors: List[ConnectorMetric]
