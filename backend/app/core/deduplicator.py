import hashlib
import json
from datetime import datetime
from typing import Dict, Any, Tuple
from sqlalchemy.orm import Session
from app.models.voucher import Voucher, VoucherHistory


class VoucherDeduplicator:
    """
    Multi-tier duplicate detection and data merging engine.
    Ensures voucher history audit trail and eliminates duplicates.
    """

    GENERIC_CODES = {
        "UNKNOWN", "LƯU BANNER", "SĂN KHUNG GIỜ", "MÃ LIVE", "MÃ VIDEO",
        "MÃ SẴN VÍ", "LƯU TRÊN APP", "SHOPEE_LIVE", "SHOPEE_SALE"
    }

    @staticmethod
    def calculate_fingerprint(data: Dict[str, Any]) -> str:
        """
        Creates a deterministic SHA-256 fingerprint from immutable financial terms
        and program name signature.
        """
        raw_key = (
            f"{data.get('code', '').upper()}_"
            f"{data.get('program_name', '')[:50].strip()}_"
            f"{data.get('discount_type', '')}_"
            f"{data.get('discount_value', 0)}_"
            f"{data.get('discount_unit', '')}_"
            f"{data.get('min_spend', 0)}_"
            f"{data.get('max_discount', '')}_"
            f"{data.get('category', '')}_"
            f"{data.get('usage_scope', '')}"
        )
        return hashlib.sha256(raw_key.encode("utf-8")).hexdigest()

    @staticmethod
    def process_and_deduplicate(
        db: Session,
        normalized_data: Dict[str, Any],
        scores: Dict[str, float],
        tags: list,
        ranking_reason: str
    ) -> Tuple[Voucher, bool, bool, bool]:
        """
        Process record against existing database records.
        Returns: (voucher_record, is_new, is_updated, is_duplicate)
        """
        fingerprint = VoucherDeduplicator.calculate_fingerprint(normalized_data)
        
        # Check by fingerprint first
        existing_voucher = db.query(Voucher).filter(Voucher.fingerprint == fingerprint).first()
        
        # If not found by fingerprint, also check by exact code IF code is an explicit typed code
        if not existing_voucher and normalized_data.get("code") not in VoucherDeduplicator.GENERIC_CODES:
            existing_voucher = db.query(Voucher).filter(
                Voucher.code == normalized_data["code"],
                Voucher.category == normalized_data["category"]
            ).first()

        now = datetime.utcnow()

        if existing_voucher:
            is_updated = False
            
            # Check for changes in expiry date
            if (
                normalized_data.get("expires_at")
                and existing_voucher.expires_at != normalized_data["expires_at"]
            ):
                hist = VoucherHistory(
                    voucher_id=existing_voucher.id,
                    changed_at=now,
                    change_type="EXPIRATION_CHANGE",
                    field_name="expires_at",
                    old_value=str(existing_voucher.expires_at),
                    new_value=str(normalized_data["expires_at"]),
                    connector_name=normalized_data["connector_name"]
                )
                db.add(hist)
                existing_voucher.expires_at = normalized_data["expires_at"]
                is_updated = True

            # Check for verification status upgrade
            new_status = normalized_data.get("verification_status", "UNVERIFIED")
            if (
                new_status == "VERIFIED"
                and existing_voucher.verification_status != "VERIFIED"
            ):
                hist = VoucherHistory(
                    voucher_id=existing_voucher.id,
                    changed_at=now,
                    change_type="STATUS_CHANGE",
                    field_name="verification_status",
                    old_value=existing_voucher.verification_status,
                    new_value="VERIFIED",
                    connector_name=normalized_data["connector_name"]
                )
                db.add(hist)
                existing_voucher.verification_status = "VERIFIED"
                is_updated = True

            # Always refresh scores and updated_at
            existing_voucher.overall_score = scores.get("overall_score", existing_voucher.overall_score)
            existing_voucher.value_score = scores.get("value_score", existing_voucher.value_score)
            existing_voucher.reliability_score = scores.get("reliability_score", existing_voucher.reliability_score)
            existing_voucher.applicability_score = scores.get("applicability_score", existing_voucher.applicability_score)
            existing_voucher.urgency_score = scores.get("urgency_score", existing_voucher.urgency_score)
            existing_voucher.confidence_score = scores.get("confidence_score", existing_voucher.confidence_score)
            existing_voucher.ranking_reason = ranking_reason
            existing_voucher.tags = json.dumps(tags, ensure_ascii=False)
            existing_voucher.updated_at = now

            if is_updated:
                db.flush()
                return existing_voucher, False, True, False
            else:
                db.flush()
                return existing_voucher, False, False, True

        # Brand new voucher
        new_voucher = Voucher(
            code=normalized_data["code"],
            fingerprint=fingerprint,
            program_name=normalized_data["program_name"],
            description=normalized_data["description"],
            discount_type=normalized_data["discount_type"],
            discount_value=normalized_data["discount_value"],
            discount_unit=normalized_data["discount_unit"],
            min_spend=normalized_data["min_spend"],
            max_discount=normalized_data["max_discount"],
            category=normalized_data["category"],
            shop_name=normalized_data.get("shop_name"),
            product_url=normalized_data.get("product_url"),
            source_url=normalized_data.get("source_url"),
            connector_name=normalized_data["connector_name"],
            claim_url=normalized_data.get("claim_url"),
            usage_scope=normalized_data["usage_scope"],
            starts_at=normalized_data.get("starts_at"),
            expires_at=normalized_data.get("expires_at"),
            terms=normalized_data.get("terms"),
            verification_status=normalized_data["verification_status"],
            is_saved_to_account=normalized_data["is_saved_to_account"],
            is_archived=False,
            overall_score=scores["overall_score"],
            value_score=scores["value_score"],
            reliability_score=scores["reliability_score"],
            applicability_score=scores["applicability_score"],
            urgency_score=scores["urgency_score"],
            confidence_score=scores["confidence_score"],
            ranking_reason=ranking_reason,
            tags=json.dumps(tags, ensure_ascii=False),
            raw_data=json.dumps(normalized_data.get("raw_data", {}), ensure_ascii=False, default=str),
            detected_at=now,
            updated_at=now
        )
        db.add(new_voucher)
        db.flush()

        # Add initial history record
        hist = VoucherHistory(
            voucher_id=new_voucher.id,
            changed_at=now,
            change_type="NEW_DETECTION",
            field_name="all",
            old_value=None,
            new_value="Voucher phát hiện lần đầu",
            connector_name=normalized_data["connector_name"]
        )
        db.add(hist)
        db.flush()

        return new_voucher, True, False, False
