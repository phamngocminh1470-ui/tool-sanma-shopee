import re
from datetime import datetime
from typing import Dict, Any, Tuple, Optional


class VoucherNormalizer:
    """
    Standardizes voucher code, currency numbers, discounts,
    dates, categories, and scope parameters.
    """

    SPECIAL_BANNER_CODES = {
        "LƯU BANNER", "SĂN KHUNG GIỜ", "MÃ SHOPEE LIVE", "MÃ LIVE",
        "MÃ SHOPEE VIDEO", "MÃ VIDEO", "MÃ SẴN VÍ", "LƯU TRÊN APP", "SHOPEE_LIVE", "SHOPEE_SALE"
    }

    @staticmethod
    def clean_code(raw_code: Optional[str]) -> str:
        if not raw_code:
            return "UNKNOWN"
        raw_str = str(raw_code).strip().upper()
        if raw_str in VoucherNormalizer.SPECIAL_BANNER_CODES:
            return raw_str
        # For actual alphanumeric coupon codes:
        clean = re.sub(r"\s+", "", raw_str)
        clean = re.sub(r"[^A-Z0-9_\-]", "", clean)
        return clean if clean else "UNKNOWN"

    @staticmethod
    def parse_money(val: Any) -> float:
        if val is None:
            return 0.0
        if isinstance(val, (int, float)):
            return float(val)
        
        text = str(val).lower().strip().replace(",", "").replace(".", "").replace("đ", "").replace("vnd", "")
        # Handle 'k' multiplier (e.g. '50k' -> 50000)
        k_match = re.search(r"(\d+(?:\.\d+)?)\s*k", text)
        if k_match:
            try:
                return float(k_match.group(1)) * 1000.0
            except ValueError:
                pass

        # Handle 'tr' or 'm' multiplier (e.g. '1tr' -> 1000000)
        tr_match = re.search(r"(\d+(?:\.\d+)?)\s*(?:tr|m|trieu)", text)
        if tr_match:
            try:
                return float(tr_match.group(1)) * 1000000.0
            except ValueError:
                pass

        # Extract direct digits
        digits = re.findall(r"\d+", text)
        if digits:
            try:
                return float("".join(digits))
            except ValueError:
                return 0.0
        return 0.0

    @staticmethod
    def parse_discount(raw_value: Any, unit: Optional[str] = None) -> Tuple[float, str]:
        """
        Returns (value, unit) where unit in ['VND', '%', 'COIN']
        """
        if raw_value is None:
            return 0.0, "VND"
        
        text = str(raw_value).strip().lower()
        if "%" in text:
            num = re.findall(r"\d+(?:\.\d+)?", text)
            return (float(num[0]) if num else 0.0), "%"
        
        if "xu" in text or "coin" in text:
            num = re.findall(r"\d+(?:\.\d+)?", text)
            return (float(num[0]) if num else 0.0), "COIN"
            
        if unit == "%":
            try:
                return float(raw_value), "%"
            except (ValueError, TypeError):
                return 0.0, "%"
                
        money = VoucherNormalizer.parse_money(raw_value)
        return money, "VND"

    @staticmethod
    def parse_datetime(dt_val: Any) -> Optional[datetime]:
        if not dt_val:
            return None
        if isinstance(dt_val, datetime):
            return dt_val
        if isinstance(dt_val, (int, float)):
            # Epoch timestamp (check if seconds or ms)
            if dt_val > 100000000000:
                return datetime.utcfromtimestamp(dt_val / 1000.0)
            return datetime.utcfromtimestamp(dt_val)
        
        str_val = str(dt_val).strip()
        # Formats to try
        formats = [
            "%Y-%m-%dT%H:%M:%S",
            "%Y-%m-%dT%H:%M:%SZ",
            "%Y-%m-%d %H:%M:%S",
            "%Y-%m-%d",
            "%d/%m/%Y %H:%M:%S",
            "%d/%m/%Y %H:%M",
            "%d/%m/%Y",
            "%Y/%m/%d %H:%M:%S",
            "%Y/%m/%d",
        ]
        for fmt in formats:
            try:
                return datetime.strptime(str_val.split(".")[0], fmt)
            except (ValueError, IndexError):
                continue
        return None

    @staticmethod
    def infer_category(text: str) -> str:
        s = text.lower()
        if any(w in s for w in ["điện tử", "công nghệ", "điện thoại", "laptop", "máy tính", "tai nghe", "anker", "samsung", "apple"]):
            return "Điện Tử & Công Nghệ"
        if any(w in s for w in ["thời trang", "quần áo", "giày", "túi xách", "phụ kiện", "đồng hồ", "nam", "nữ"]):
            return "Thời Trang & Làm Đẹp"
        if any(w in s for w in ["mỹ phẩm", "son", "chăm sóc da", "serum", "kem chống nắng"]):
            return "Sức Khỏe & Sắc Đẹp"
        if any(w in s for w in ["mẹ & bé", "mẹ và bé", "sữa", "tã", "bỉm", "đồ chơi"]):
            return "Mẹ & Bé"
        if any(w in s for w in ["bách hóa", "thực phẩm", "tiêu dùng", "bánh kẹo", "đồ uống"]):
            return "Bách Hóa & Tiêu Dùng"
        if any(w in s for w in ["đời sống", "nhà cửa", "gia dụng", "nội thất", "bếp", "nồi chiên"]):
            return "Nhà Cửa & Đời Sống"
        if any(w in s for w in ["quốc tế", "hàng quốc tế", "global", "cross border"]):
            return "Hàng Quốc Tế"
        if any(w in s for w in ["vận chuyển", "freeship", "ship", "giao hàng"]):
            return "Vận Chuyển Freeship"
        if any(w in s for w in ["shopeepay", "spaylater", "ngân hàng", "ví"]):
            return "Thanh Toán & Ví"
        return "Toàn sàn"

    @staticmethod
    def normalize_record(raw: Dict[str, Any], connector_name: str) -> Dict[str, Any]:
        """
        Normalizes a raw voucher dictionary into a clean dictionary
        """
        raw_code = raw.get("code") or raw.get("voucher_code") or raw.get("coupon_code")
        clean_code = VoucherNormalizer.clean_code(raw_code)
        
        program_name = (
            raw.get("program_name")
            or raw.get("title")
            or raw.get("name")
            or f"Mã ưu đãi {clean_code}"
        ).strip()
        
        desc = (raw.get("description") or raw.get("desc") or "").strip()
        
        # Discounts
        raw_discount = raw.get("discount_value") or raw.get("discount") or raw.get("amount") or 0
        raw_unit = raw.get("discount_unit") or raw.get("unit")
        discount_value, discount_unit = VoucherNormalizer.parse_discount(raw_discount, raw_unit)
        
        min_spend = VoucherNormalizer.parse_money(
            raw.get("min_spend") or raw.get("min_order") or raw.get("don_toi_thieu") or 0
        )
        
        max_discount = raw.get("max_discount") or raw.get("giam_toi_da")
        if max_discount is not None:
            max_discount = VoucherNormalizer.parse_money(max_discount)
            
        # Category
        category = raw.get("category") or VoucherNormalizer.infer_category(
            f"{program_name} {desc} {clean_code}"
        )
        
        # Scope
        usage_scope = raw.get("usage_scope") or "ALL_PLATFORM"
        if "toàn sàn" in program_name.lower() or "toàn sàn" in desc.lower():
            usage_scope = "ALL_PLATFORM"
        elif raw.get("shop_name"):
            usage_scope = "SHOP"
        elif "ngành hàng" in desc.lower():
            usage_scope = "CATEGORY"

        # Dates
        starts_at = VoucherNormalizer.parse_datetime(raw.get("starts_at") or raw.get("start_time"))
        expires_at = VoucherNormalizer.parse_datetime(raw.get("expires_at") or raw.get("end_time"))
        
        # URLs
        source_url = raw.get("source_url") or "https://shopee.vn"
        claim_url = raw.get("claim_url") or f"https://shopee.vn/search?keyword={clean_code}"
        
        return {
            "code": clean_code,
            "program_name": program_name,
            "description": desc,
            "discount_type": raw.get("discount_type") or ("PERCENTAGE" if discount_unit == "%" else "FIXED_AMOUNT"),
            "discount_value": discount_value,
            "discount_unit": discount_unit,
            "min_spend": min_spend,
            "max_discount": max_discount,
            "category": category,
            "shop_name": raw.get("shop_name"),
            "product_url": raw.get("product_url"),
            "source_url": source_url,
            "connector_name": connector_name,
            "claim_url": claim_url,
            "usage_scope": usage_scope,
            "starts_at": starts_at,
            "expires_at": expires_at,
            "terms": raw.get("terms") or raw.get("condition") or "",
            "verification_status": raw.get("verification_status") or "UNVERIFIED",
            "is_saved_to_account": bool(raw.get("is_saved_to_account", False)),
            "raw_data": raw,
        }
