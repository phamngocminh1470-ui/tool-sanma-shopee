from datetime import datetime, timedelta
from typing import Dict, Any, Tuple
from app.config import settings


class VoucherRanker:
    """
    Smart Voucher Ranking Engine.
    Computes calibrated 0-100 scores across 5 core dimensions:
    - Value Score (Tiết kiệm thực tế & Tỷ lệ giảm)
    - Reliability Score (Độ tin cậy nguồn & Connector)
    - Applicability Score (Phạm vi áp dụng & Đơn tối thiểu)
    - Expiration Urgency Score (Độ khẩn cấp thời hạn)
    - Verification Confidence Score (Độ tin cậy xác minh)
    """

    @staticmethod
    def calculate_value_score(data: Dict[str, Any]) -> float:
        val = float(data.get("discount_value", 0.0))
        unit = data.get("discount_unit", "VND")
        min_spend = float(data.get("min_spend", 0.0))
        max_discount = data.get("max_discount")
        
        score = 40.0
        if unit == "%":
            # 10% -> 50, 20% -> 70, 50% -> 95
            score = min(98.0, max(20.0, val * 1.8 + 15.0))
            if max_discount and float(max_discount) < 30000:
                # Capped at small amount, reduce slightly
                score = max(30.0, score - 15.0)
            elif max_discount and float(max_discount) >= 100000:
                score = min(100.0, score + 10.0)
        else:
            # Fixed VND amount
            if val >= 200000:
                score = 95.0
            elif val >= 100000:
                score = 88.0
            elif val >= 50000:
                score = 75.0
            elif val >= 25000:
                score = 65.0
            elif val >= 10000:
                score = 50.0
            else:
                score = 35.0

        # Bonus for 0Đ min spend
        if min_spend == 0.0:
            score = min(100.0, score + 12.0)
        elif min_spend <= 50000:
            score = min(100.0, score + 6.0)
        elif min_spend >= 1000000:
            score = max(20.0, score - 10.0)

        return round(score, 1)

    @staticmethod
    def calculate_reliability_score(data: Dict[str, Any]) -> float:
        connector = data.get("connector_name", "").lower()
        if "shopee_public_deals" in connector or "official" in connector:
            return 95.0
        elif "shopee_freeship" in connector or "bank" in connector or "shopeepay" in connector:
            return 90.0
        elif "shopee_category" in connector:
            return 85.0
        elif "aggregator" in connector or "feed" in connector:
            return 75.0
        return 65.0

    @staticmethod
    def calculate_applicability_score(data: Dict[str, Any]) -> float:
        scope = data.get("usage_scope", "ALL_PLATFORM")
        min_spend = float(data.get("min_spend", 0.0))
        
        base = 50.0
        if scope == "ALL_PLATFORM":
            base = 92.0
        elif scope == "CATEGORY":
            base = 78.0
        elif scope == "SHOP":
            base = 62.0
        elif scope == "PRODUCT":
            base = 45.0

        if min_spend == 0.0:
            base = min(100.0, base + 8.0)
        elif min_spend > 500000:
            base = max(30.0, base - 8.0)

        return round(base, 1)

    @staticmethod
    def calculate_urgency_score(data: Dict[str, Any]) -> float:
        expires_at = data.get("expires_at")
        if not expires_at:
            return 50.0  # Moderate default when no expiration specified
            
        now = datetime.utcnow()
        if expires_at < now:
            return 5.0  # Expired
            
        remaining_seconds = (expires_at - now).total_seconds()
        hours = remaining_seconds / 3600.0
        
        if hours <= 3.0:
            return 98.0  # Critical urgency
        elif hours <= 12.0:
            return 90.0
        elif hours <= 24.0:
            return 82.0
        elif hours <= 72.0:
            return 65.0
        elif hours <= 168.0:  # 7 days
            return 50.0
        return 35.0

    @staticmethod
    def calculate_confidence_score(data: Dict[str, Any]) -> float:
        status = data.get("verification_status", "UNVERIFIED")
        if status == "VERIFIED":
            return 95.0
        elif status == "NEEDS_REVIEW":
            return 35.0
        elif status == "INELIGIBLE":
            return 15.0
        return 60.0  # UNVERIFIED default

    @classmethod
    def evaluate(cls, data: Dict[str, Any]) -> Tuple[Dict[str, float], str]:
        val_score = cls.calculate_value_score(data)
        rel_score = cls.calculate_reliability_score(data)
        app_score = cls.calculate_applicability_score(data)
        urg_score = cls.calculate_urgency_score(data)
        conf_score = cls.calculate_confidence_score(data)

        # Weighted composite score
        overall = (
            val_score * settings.WEIGHT_VALUE
            + rel_score * settings.WEIGHT_RELIABILITY
            + app_score * settings.WEIGHT_APPLICABILITY
            + urg_score * settings.WEIGHT_URGENCY
            + conf_score * settings.WEIGHT_CONFIDENCE
        )
        overall = round(max(0.0, min(100.0, overall)), 1)

        # Build human-readable ranking reason
        reasons = []
        if val_score >= 80:
            reasons.append("Mức giảm hấp dẫn")
        if app_score >= 85:
            reasons.append("Phạm vi rộng (Toàn sàn/Đơn từ 0Đ)")
        if urg_score >= 80:
            reasons.append("Thời hạn gấp")
        if conf_score >= 90:
            reasons.append("Đã xác minh nguồn")
            
        reason_text = " • ".join(reasons) if reasons else "Ưu đãi tiêu chuẩn Shopee"

        return {
            "overall_score": overall,
            "value_score": val_score,
            "reliability_score": rel_score,
            "applicability_score": app_score,
            "urgency_score": urg_score,
            "confidence_score": conf_score,
        }, reason_text
