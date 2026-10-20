from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, ForeignKey, Index
from sqlalchemy.orm import relationship
from app.database import Base


class Voucher(Base):
    __tablename__ = "vouchers"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(100), index=True, nullable=False)
    fingerprint = Column(String(64), unique=True, index=True, nullable=False)
    program_name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    
    # Financial fields
    discount_type = Column(String(50), nullable=False, default="UNKNOWN")
    discount_value = Column(Float, nullable=False, default=0.0)
    discount_unit = Column(String(20), nullable=False, default="VND")
    min_spend = Column(Float, nullable=False, default=0.0)
    max_discount = Column(Float, nullable=True)
    
    # Scope & Categorization
    category = Column(String(100), index=True, nullable=False, default="Toàn sàn")
    shop_name = Column(String(150), nullable=True)
    product_url = Column(Text, nullable=True)
    source_url = Column(Text, nullable=True)
    connector_name = Column(String(100), index=True, nullable=False)
    claim_url = Column(Text, nullable=True)
    usage_scope = Column(String(50), nullable=False, default="ALL_PLATFORM")
    
    # Validity
    starts_at = Column(DateTime, nullable=True)
    expires_at = Column(DateTime, nullable=True, index=True)
    terms = Column(Text, nullable=True)
    
    # Verification & Status
    verification_status = Column(String(50), index=True, nullable=False, default="UNVERIFIED")
    is_saved_to_account = Column(Boolean, default=False)
    is_archived = Column(Boolean, default=False, index=True)
    
    # Smart Ranking Scores (0 - 100)
    overall_score = Column(Float, index=True, nullable=False, default=50.0)
    value_score = Column(Float, nullable=False, default=50.0)
    reliability_score = Column(Float, nullable=False, default=50.0)
    applicability_score = Column(Float, nullable=False, default=50.0)
    urgency_score = Column(Float, nullable=False, default=50.0)
    confidence_score = Column(Float, nullable=False, default=50.0)
    ranking_reason = Column(String(255), nullable=True)
    
    # Metadata & Tags
    tags = Column(Text, nullable=False, default="[]")  # JSON string array
    raw_data = Column(Text, nullable=True)             # JSON payload
    detected_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    history = relationship("VoucherHistory", back_populates="voucher", cascade="all, delete-orphan")


class VoucherHistory(Base):
    __tablename__ = "voucher_history"

    id = Column(Integer, primary_key=True, index=True)
    voucher_id = Column(Integer, ForeignKey("vouchers.id", ondelete="CASCADE"), nullable=False, index=True)
    changed_at = Column(DateTime, default=datetime.utcnow)
    change_type = Column(String(50), nullable=False)
    field_name = Column(String(100), nullable=False)
    old_value = Column(Text, nullable=True)
    new_value = Column(Text, nullable=True)
    connector_name = Column(String(100), nullable=True)

    voucher = relationship("Voucher", back_populates="history")
