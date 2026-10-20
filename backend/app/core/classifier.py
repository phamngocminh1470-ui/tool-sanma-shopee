from datetime import datetime, timedelta
from typing import Dict, Any, List


class VoucherClassifier:
    """
    AI & Heuristic Multi-Dimensional Auto Classification Engine.
    Classifies vouchers along 4 distinct dimensions:
    1. Type & Mechanism
    2. Attractiveness & Discount Tier
    3. Lifecycle & Verification Status
    4. Target Scope & Reach
    """

    @staticmethod
    def classify(data: Dict[str, Any]) -> List[str]:
        tags: List[str] = []
        name = (data.get("program_name") or "").lower()
        desc = (data.get("description") or "").lower()
        code = (data.get("code") or "").upper()
        unit = data.get("discount_unit", "VND")
        val = float(data.get("discount_value", 0.0))
        min_spend = float(data.get("min_spend", 0.0))
        scope = data.get("usage_scope", "ALL_PLATFORM")
        status = data.get("verification_status", "UNVERIFIED")
        expires_at = data.get("expires_at")
        detected_at = data.get("detected_at") or datetime.utcnow()

        # ==========================================
        # DIMENSION 1: LOẠI ƯU ĐÃI (TYPE & MECHANISM)
        # ==========================================
        if "freeship" in name or "freeship" in desc or "vận chuyển" in name or "ship" in code:
            tags.append("Voucher miễn phí vận chuyển")
        elif unit == "%":
            tags.append("Voucher giảm theo phần trăm")
        elif unit == "COIN" or "hoàn xu" in name or "hoàn xu" in desc or "cashback" in name:
            tags.append("Voucher hoàn xu Shopee")
        else:
            tags.append("Voucher giảm tiền cố định")

        if any(w in name or w in desc for w in ["live", "livestream", "shopee live"]):
            tags.append("Voucher livestream")
        if any(w in name or w in desc for w in ["sale", "chớp nhoáng", "flash sale", "siêu sale", "11.11", "12.12", "đại tiệc"]):
            tags.append("Voucher chương trình đặc biệt")
        if any(w in name or w in desc for w in ["spaylater", "shopeepay", "ví", "ngân hàng", "visa", "mastercard"]):
            tags.append("Ưu đãi thanh toán & Ví")

        # ==========================================
        # DIMENSION 2: MỨC ĐỘ HẤP DẪN (ATTRACTIVENESS)
        # ==========================================
        # Normalize equivalent savings for tiering
        is_massive = False
        is_high = False

        if unit == "%":
            if val >= 40.0:
                tags.append("Giảm rất cao")
                is_massive = True
            elif val >= 20.0:
                tags.append("Giảm cao")
                is_high = True
            elif val >= 10.0:
                tags.append("Giảm trung bình")
            else:
                tags.append("Giảm thấp")
        else:
            # VND
            if val >= 150000:
                tags.append("Giảm rất cao")
                is_massive = True
            elif val >= 50000:
                tags.append("Giảm cao")
                is_high = True
            elif val >= 20000:
                tags.append("Giảm trung bình")
            else:
                tags.append("Giảm thấp")

        # Standout value: 0đ min spend or huge discount
        if min_spend == 0.0 and val > 0:
            tags.append("Giá trị nổi bật: Đơn từ 0Đ")
        elif is_massive or (data.get("max_discount") and float(data["max_discount"]) >= 300000):
            tags.append("Giá trị nổi bật")

        # ==========================================
        # DIMENSION 3: TRẠNG THÁI (STATUS)
        # ==========================================
        now = datetime.utcnow()
        if (now - detected_at).total_seconds() < 86400:  # < 24 hours
            tags.append("Mới phát hiện")

        if status == "VERIFIED":
            tags.append("Đã xác minh")
        elif status == "NEEDS_REVIEW":
            tags.append("Cần kiểm tra lại")
        else:
            tags.append("Chưa xác minh")

        if expires_at:
            if expires_at < now:
                tags.append("Đã hết hạn")
            elif expires_at <= now + timedelta(hours=24):
                tags.append("Sắp hết hạn")

        # ==========================================
        # DIMENSION 4: PHẠM VI (SCOPE)
        # ==========================================
        if scope == "ALL_PLATFORM" or "toàn sàn" in name or "toàn sàn" in desc:
            tags.append("Toàn sàn Shopee")
        elif scope == "CATEGORY" or "ngành hàng" in name or "ngành hàng" in desc:
            tags.append("Voucher ngành hàng")
        elif scope == "SHOP" or data.get("shop_name"):
            tags.append("Voucher Shop")
        elif scope == "PRODUCT":
            tags.append("Voucher sản phẩm")

        return list(dict.fromkeys(tags))  # Deduplicate while preserving order
