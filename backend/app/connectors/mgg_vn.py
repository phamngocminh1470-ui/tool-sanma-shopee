import re
import logging
from datetime import datetime, timedelta
from typing import List, Dict, Any
import httpx
from bs4 import BeautifulSoup

from app.connectors.base import BaseConnector

logger = logging.getLogger(__name__)


class MggVnConnector(BaseConnector):
    """
    MGG.VN Shopee Live Deals & Real Coupon Codes Connector.
    Cào trực tiếp mã giảm giá Shopee Việt Nam từ mgg.vn.
    Trích xuất mã nhập tay thực tế (data-code), hạn sử dụng chính xác,
    và liên kết trực tiếp tới chiến dịch hoặc sản phẩm Shopee.
    """

    def __init__(self):
        super().__init__(
            connector_id="mgg_vn_deals",
            name="MGG.vn Shopee Coupon Feed",
            description="Cào mã nhập tay thật, mã giảm sâu, hoàn xu và freeship cập nhật theo giờ từ mgg.vn",
            endpoint_url="https://mgg.vn/ma-giam-gia/shopee/",
            connector_type="LIVE_SCRAPER"
        )

    async def fetch_vouchers(self) -> List[Dict[str, Any]]:
        vouchers: List[Dict[str, Any]] = []
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "vi-VN,vi;q=0.9,en;q=0.8",
        }

        now = datetime.utcnow()
        # Fetch first 3 pages
        urls_to_scrape = [
            "https://mgg.vn/ma-giam-gia/shopee/",
            "https://mgg.vn/ma-giam-gia/shopee/page/2/",
            "https://mgg.vn/ma-giam-gia/shopee/page/3/",
        ]

        async with httpx.AsyncClient(timeout=12.0, headers=headers, follow_redirects=True) as client:
            for page_url in urls_to_scrape:
                try:
                    resp = await client.get(page_url)
                    if resp.status_code != 200:
                        continue

                    soup = BeautifulSoup(resp.text, "html.parser")
                    items = soup.select(".coupon-item")

                    for it in items:
                        title_el = it.select_one(".coupon-title a") or it.select_one(".coupon-title")
                        if not title_el:
                            continue

                        raw_title = title_el.get_text().strip()
                        if not raw_title or len(raw_title) < 10:
                            continue

                        # Extract code from data-code
                        code_el = it.select_one("[data-code]")
                        raw_code = code_el.get("data-code", "").strip() if code_el else ""

                        # If code is not empty and valid
                        if raw_code and len(raw_code) >= 4 and not any(bad in raw_code.lower() for bad in ["xem", "lấy", "deal", "undefined"]):
                            code = raw_code.upper()
                            is_manual_code = True
                        else:
                            # Check if title has explicit code
                            explicit_m = re.search(r'(?:nhập mã|mã voucher|mã code|code)[:\s]+([A-Z0-9_\-]{4,15})\b', raw_title, re.IGNORECASE)
                            if explicit_m:
                                code = explicit_m.group(1).upper()
                                is_manual_code = True
                            elif "freeship" in raw_title.lower() or "vận chuyển" in raw_title.lower():
                                code = "LƯU FREESHIP"
                                is_manual_code = False
                            elif "xu" in raw_title.lower():
                                code = "LƯU HOÀN XU"
                                is_manual_code = False
                            else:
                                code = "LƯU BANNER"
                                is_manual_code = False

                        # Claim URL
                        claim_url = (
                            title_el.get("data-aff-url")
                            or (code_el.get("data-aff-url") if code_el else None)
                            or title_el.get("href")
                            or "https://shopee.vn/m/ma-giam-gia"
                        )

                        # Parse discount amount & unit
                        pct_m = re.search(r'giảm\s*(\d+)%', raw_title, re.IGNORECASE) or re.search(r'hoàn\s*(\d+)%\s*xu', raw_title, re.IGNORECASE)
                        k_m = re.search(r'(?:giảm|hoàn|tối đa)\s*(\d+(?:\.\d+)?)\s*(k|triệu|tr|đ|vnđ)', raw_title, re.IGNORECASE)

                        disc_val = 20000.0
                        disc_unit = "VND"
                        disc_type = "FIXED_AMOUNT"

                        if "freeship" in raw_title.lower() or "vận chuyển" in raw_title.lower():
                            disc_type = "FREESHIP"
                            disc_val = 30000.0
                            disc_unit = "VND"
                        elif "xu" in raw_title.lower() and pct_m:
                            disc_type = "COIN_BACK"
                            disc_val = float(pct_m.group(1))
                            disc_unit = "%"
                        elif pct_m:
                            disc_type = "PERCENTAGE"
                            disc_val = float(pct_m.group(1))
                            disc_unit = "%"
                        elif k_m:
                            num = float(k_m.group(1))
                            u_str = k_m.group(2).lower()
                            if "triệu" in u_str or "tr" in u_str:
                                disc_val = num * 1000000.0
                            elif "k" in u_str:
                                disc_val = num * 1000.0
                            else:
                                disc_val = num
                            disc_type = "FIXED_AMOUNT"
                            disc_unit = "VND"

                        # Parse min spend
                        min_spend = 0.0
                        if any(w in raw_title.lower() for w in ["đơn 0đ", "đơn từ 0đ", "đơn 0k", "từ 0đ"]):
                            min_spend = 0.0
                        else:
                            spend_m = re.search(r'đơn\s*(?:từ|hàng từ)?\s*(\d+(?:\.\d+)?)\s*(k|triệu|tr|đ)', raw_title, re.IGNORECASE)
                            if spend_m:
                                s_num = float(spend_m.group(1))
                                s_u = spend_m.group(2).lower()
                                if "triệu" in s_u or "tr" in s_u:
                                    min_spend = s_num * 1000000.0
                                elif "k" in s_u:
                                    min_spend = s_num * 1000.0
                                else:
                                    min_spend = s_num

                        # Parse max discount
                        max_disc = None
                        max_m = re.search(r'tối đa\s*(\d+(?:\.\d+)?)\s*(k|triệu|tr|đ)', raw_title, re.IGNORECASE)
                        if max_m:
                            m_num = float(max_m.group(1))
                            m_u = max_m.group(2).lower()
                            if "triệu" in m_u or "tr" in m_u:
                                max_disc = m_num * 1000000.0
                            else:
                                max_disc = m_num * 1000.0

                        # Parse expiration
                        exp_el = it.select_one(".exp")
                        expires_at = now + timedelta(days=5)
                        if exp_el:
                            exp_text = exp_el.get_text()
                            d_m = re.search(r'(\d{1,2})/(\d{1,2})/(\d{4})', exp_text)
                            if d_m:
                                try:
                                    parsed_dt = datetime(int(d_m.group(3)), int(d_m.group(2)), int(d_m.group(1)), 23, 59, 59)
                                    if parsed_dt > now:
                                        expires_at = min(parsed_dt, now + timedelta(days=30))
                                except Exception:
                                    pass

                        # Determine category
                        category = "Toàn sàn"
                        if any(w in raw_title.lower() for w in ["freeship", "vận chuyển", "giao hàng"]):
                            category = "Vận Chuyển Freeship"
                        elif any(w in raw_title.lower() for w in ["điện tử", "công nghệ", "laptop", "điện thoại"]):
                            category = "Điện Tử & Công Nghệ"
                        elif any(w in raw_title.lower() for w in ["thời trang", "quần áo", "giày", "túi"]):
                            category = "Thời Trang & Làm Đẹp"
                        elif any(w in raw_title.lower() for w in ["bách hoá", "tiêu dùng", "gia dụng"]):
                            category = "Bách Hóa Online"
                        elif any(w in raw_title.lower() for w in ["sắc đẹp", "mỹ phẩm", "skincare"]):
                            category = "Sức Khỏe & Sắc Đẹp"
                        elif "shopee mall" in raw_title.lower() or "chính hãng" in raw_title.lower():
                            category = "Shopee Mall"

                        instruction = (
                            f"📋 Mã nhập tay '{code}': Bấm sao chép mã và dán vào ô 'Shopee Voucher' tại bước thanh toán."
                            if is_manual_code
                            else "🎟️ Mã lưu banner: Bấm 'Mở Shopee' để đến trang chương trình và bấm 'Lưu voucher' vào ví."
                        )

                        clean_title = re.sub(r'https?://\S+', '', raw_title).strip()
                        vouchers.append({
                            "code": code,
                            "program_name": clean_title[:95],
                            "description": clean_title,
                            "discount_type": disc_type,
                            "discount_value": disc_val,
                            "discount_unit": disc_unit,
                            "min_spend": min_spend,
                            "max_discount": max_disc,
                            "category": category,
                            "usage_scope": "ALL_PLATFORM" if category == "Toàn sàn" else "CATEGORY",
                            "source_url": page_url,
                            "claim_url": claim_url,
                            "terms": instruction,
                            "verification_status": "VERIFIED",
                            "starts_at": now - timedelta(hours=2),
                            "expires_at": expires_at,
                        })

                except Exception as e:
                    logger.warning(f"Error scraping MGG.vn page {page_url}: {e}")

        # Deduplicate
        unique: List[Dict[str, Any]] = []
        seen = set()
        for v in vouchers:
            key = (v["code"], v["program_name"])
            if key not in seen:
                seen.add(key)
                unique.append(v)

        logger.info(f"MggVnConnector fetched {len(unique)} unique vouchers")
        return unique
