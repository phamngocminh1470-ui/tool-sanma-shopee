from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field


class VoucherBase(BaseModel):
    code: str
    program_name: str
    description: Optional[str] = None
    discount_type: str = "UNKNOWN"
    discount_value: float = 0.0
    discount_unit: str = "VND"
    min_spend: float = 0.0
    max_discount: Optional[float] = None
    category: str = "Toàn sàn"
    shop_name: Optional[str] = None
    product_url: Optional[str] = None
    source_url: Optional[str] = None
    connector_name: str
    claim_url: Optional[str] = None
    usage_scope: str = "ALL_PLATFORM"
    starts_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None
    terms: Optional[str] = None
    verification_status: str = "UNVERIFIED"
    is_saved_to_account: bool = False
    is_archived: bool = False


class VoucherCreate(VoucherBase):
    pass


class VoucherHistoryResponse(BaseModel):
    id: int
    voucher_id: int
    changed_at: datetime
    change_type: str
    field_name: str
    old_value: Optional[str] = None
    new_value: Optional[str] = None
    connector_name: Optional[str] = None

    class Config:
        from_attributes = True


class VoucherResponse(VoucherBase):
    id: int
    fingerprint: str
    overall_score: float
    value_score: float
    reliability_score: float
    applicability_score: float
    urgency_score: float
    confidence_score: float
    ranking_reason: Optional[str] = None
    tags: str
    detected_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class VoucherListResponse(BaseModel):
    items: List[VoucherResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
