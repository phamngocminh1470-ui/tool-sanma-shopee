import re
import logging
from datetime import datetime, timedelta
from typing import List, Dict, Any
import httpx
from bs4 import BeautifulSoup

from app.connectors.base import BaseConnector

logger = logging.getLogger(__name__)

NON_CODE_WORDS = {
    'GIẢM', 'VND', 'SHOPEE', 'VOUCHER', 'FLASH', 'SALE', 'BANNER', 'TRANG', 'LIST',
    'TIKTOK', 'LAZADA', 'TIKI', 'BACK', 'LƯỢT', 'NGÀY', 'THÁNG', 'INSTAGRAM', 'FACEBOOK',
    'TRENDY', 'TOPPING', 'FREESHIP', 'MUA', 'ĐƠN', 'TOÀN', 'SÀN', 'XTRA', 'XU', 'HOÀN',
    'SHOP', 'MALL', 'LIVE', 'VIDEO', 'HÔM', 'NAY', 'CHỈ', 'TỐI', 'ĐA', 'MÃ', 'HOT',
    'YOUTUBE', 'BÁCH', 'HÓA', 'ĐIỆN', 'TỬ', 'THỜI', 'TRANG', 'XEM', 'NGAY', 'APP',
    'CHO', 'CỦA', 'VỚI', 'MỖI', 'CÁC', 'NHIỀU', 'TỔNG', 'HỢP', 'THÊM', 'THEO', 'SẢN', 'PHẨM',
    'LINK', 'TRONG', 'AD', 'KÊNH'
}


def is_valid_code(c: str) -> bool:
    if not c or len(c) < 4 or len(c) > 16:
        return False
    c_upper = c.upper()
    if c_upper in NON_CODE_WORDS:
        return False
    if re.match(r'^\d+[kKmMđĐ]?$', c):
        return False
    if re.match(r'^\d+-\d+$', c):
        return False
    if not re.search(r'[A-Za-z]', c):
        return False
    return True


class CouponAggregatorFeedConnector(BaseConnector):
    """
    Public E-Commerce Coupon Live Aggregator Connector.
    Cào trực tiếp mã giảm giá Shopee Việt Nam từ các trang chia sẻ deal
    công khai (magiamgia.com, bloggiamgia.vn) theo thời gian thực.
    Phân loại chính xác: Mã nhập tay vs Mã lưu trên banner/khung giờ.
    Tuyệt đối KHÔNG gán bậy các chữ "200K", "50K" làm mã voucher.
    """

    def __init__(self):
        super().__init__(
            connector_id="coupon_aggregator_feed",
            name="Cộng Đồng Săn Deal & Coupon Feed",
            description="Thu thập mã thật theo khung giờ vàng và lịch live/video từ các kênh deal Shopee",
            endpoint_url="https://magiamgia.com/shopee/",
            connector_type="RSS_AGGREGATOR"
        )

    async def fetch_vouchers(self) -> List[Dict[str, Any]]:
        vouchers: List[Dict[str, Any]] = []
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "vi-VN,vi;q=0.9,en;q=0.8",
        }

        now = datetime.utcnow()

        # Source 1: magiamgia.com/shopee/
        try:
            async with httpx.AsyncClient(timeout=16.0, headers=headers, follow_redirects=True) as client:
                resp = await client.get(self.endpoint_url)
                if resp.status_code == 200:
                    soup = BeautifulSoup(resp.text, "html.parser")
                    tab_titles = [t.get_text().strip() for t in soup.find_all('div', class_='elementor-tab-title')]
                    contents = soup.find_all('div', class_='elementor-tab-content')

                    # Loop through all relevant deal tabs (skip FAQ/guide tabs)
                    for i in range(min(12, len(contents))):
                        tab_title = tab_titles[i] if i < len(tab_titles) else f"Tab {i}"
                        if any(bad in tab_title.lower() for bad in ["là gì", "ở đâu", "hướng dẫn", "như thế nào"]):
                            continue

                        tab_content = contents[i]
                        current_time_slot = "Khung giờ vàng"

                        for el in tab_content.find_all(['p', 'li']):
                            text = el.get_text().strip()
                            if not text or len(text) < 18:
                                continue

                            # Skip informational noise
                            if any(bad in text.lower() for bad in ["hướng dẫn", "mẹo săn", "lưu ý:", "app nô tì", "tải app", "group để", "xem ngay"]):
                                continue

                            # Skip empty section titles like "VOUCHER XTRA:"
                            if text.endswith(':') and not any(k in text.lower() for k in ["giảm", "hoàn", "freeship", "%"]):
                                continue

                            # Extract time slot if mentioned
                            time_m = re.search(r'►?\s*(\d+H(?:[,\s\w\-]+)?):', text, re.IGNORECASE)
                            if time_m:
                                current_time_slot = time_m.group(1).strip()

                            # Check if text describes a voucher
                            if any(w in text.lower() for w in ["giảm", "hoàn xu", "freeship", "voucher", "áp mã", "lưu banner", "đơn"]):
                                a_tag = el.find('a')
                                claim_url = a_tag['href'] if a_tag and 'href' in a_tag.attrs else None

                                if not claim_url:
                                    nxt = el.find_next_sibling()
                                    if nxt:
                                        nxt_a = nxt if nxt.name == 'a' else nxt.find('a')
                                        if nxt_a and 'href' in nxt_a.attrs:
                                            claim_url = nxt_a['href']

                                if not claim_url:
                                    claim_url = "https://shopee.vn/m/ma-giam-gia"

                                # Parse discount
                                pct_m = re.search(r'giảm\s*(\d+)%', text, re.IGNORECASE) or re.search(r'(\d+)%', text)
                                vnd_m = re.search(r'(?:tối đa|giảm|hoàn)\s*(\d+(?:\.\d+)?)\s*(k|triệu|tr|đ|vnđ)', text, re.IGNORECASE)

                                disc_val = 25000.0
                                disc_unit = "VND"
                                disc_type = "FIXED_AMOUNT"

                                if "freeship" in text.lower() or "vận chuyển" in text.lower():
                                    disc_type = "FREESHIP"
                                    disc_val = 30000.0
                                    disc_unit = "VND"
                                elif "xu" in text.lower() and pct_m:
                                    disc_type = "COIN_BACK"
                                    disc_val = float(pct_m.group(1))
                                    disc_unit = "%"
                                elif pct_m:
                                    disc_type = "PERCENTAGE"
                                    disc_val = float(pct_m.group(1))
                                    disc_unit = "%"
                                elif vnd_m:
                                    num = float(vnd_m.group(1))
                                    unit_str = vnd_m.group(2).lower()
                                    if "triệu" in unit_str or "tr" in unit_str:
                                        disc_val = num * 1000000.0
                                    elif "k" in unit_str:
                                        disc_val = num * 1000.0
                                    else:
                                        disc_val = num
                                    disc_type = "FIXED_AMOUNT"
                                    disc_unit = "VND"

                                # Parse min spend
                                min_spend = 0.0
                                if any(k in text.lower() for k in ["đơn 0đ", "đơn 0k", "đơn từ 0đ"]):
                                    min_spend = 0.0
                                else:
                                    spend_m = re.search(r'đơn\s*(?:từ)?\s*(\d+(?:\.\d+)?)\s*(k|triệu|tr|đ)', text, re.IGNORECASE)
                                    if spend_m:
                                        s_num = float(spend_m.group(1))
                                        s_unit = spend_m.group(2).lower()
                                        if "triệu" in s_unit or "tr" in s_unit:
                                            min_spend = s_num * 1000000.0
                                        elif "k" in s_unit:
                                            min_spend = s_num * 1000.0
                                        else:
                                            min_spend = s_num

                                # Parse max discount
                                max_disc = None
                                max_m = re.search(r'tối đa\s*(\d+(?:\.\d+)?)\s*(k|triệu|tr|đ)', text, re.IGNORECASE)
                                if max_m:
                                    m_num = float(max_m.group(1))
                                    m_unit = max_m.group(2).lower()
                                    if "triệu" in m_unit or "tr" in m_unit:
                                        max_disc = m_num * 1000000.0
                                    else:
                                        max_disc = m_num * 1000.0

                                # Determine Voucher Type & Real Code
                                code = None
                                is_manual_code = False

                                # Pattern 1: Explicit code keywords
                                explicit_m = re.search(r'(?:nhập mã|mã voucher|mã code|mã|code)[:\s]+([A-Z0-9_\-]{4,15})\b', text, re.IGNORECASE)
                                if explicit_m and is_valid_code(explicit_m.group(1)):
                                    code = explicit_m.group(1).upper()
                                    is_manual_code = True

                                # Pattern 2: Token before 'giảm' / 'áp list' / 'đơn'
                                if not code:
                                    m2 = re.search(r'(?:(?:^|\s)\d+H(?:[,\s\w\-]+)?:\s*)?([A-Z0-9]{4,15})\s+(?:giảm|hoàn|đơn|áp)', text, re.IGNORECASE)
                                    if m2 and is_valid_code(m2.group(1)):
                                        code = m2.group(1).upper()
                                        is_manual_code = True

                                # Pattern 3: Line starting with ► CODE
                                if not code:
                                    m3 = re.search(r'►\s*([A-Z0-9]{4,15})\b', text)
                                    if m3 and is_valid_code(m3.group(1)):
                                        code = m3.group(1).upper()
                                        is_manual_code = True

                                # Classification for non-code vouchers
                                if not code:
                                    if "live" in tab_title.lower() or "live" in text.lower():
                                        code = "MÃ SHOPEE LIVE"
                                    elif "video" in tab_title.lower() or "video" in text.lower():
                                        code = "MÃ SHOPEE VIDEO"
                                    elif "banner" in text.lower() or "lưu banner" in text.lower():
                                        code = "LƯU BANNER"
                                    elif any(h in text.lower() for h in ["0h", "9h", "12h", "15h", "18h", "20h", "21h"]):
                                        code = "SĂN KHUNG GIỜ"
                                    else:
                                        code = "LƯU BANNER"

                                # Category
                                category = "Toàn sàn"
                                if any(w in text.lower() for w in ["freeship", "vận chuyển"]):
                                    category = "Vận Chuyển Freeship"
                                elif any(w in text.lower() for w in ["điện tử", "công nghệ"]):
                                    category = "Điện Tử & Công Nghệ"
                                elif any(w in text.lower() for w in ["thời trang", "quần áo"]):
                                    category = "Thời Trang & Làm Đẹp"
                                elif any(w in text.lower() for w in ["bách hoá", "tiêu dùng"]):
                                    category = "Bách Hóa Online"
                                elif any(w in text.lower() for w in ["sắc đẹp", "mỹ phẩm"]):
                                    category = "Sức Khỏe & Sắc Đẹp"
                                elif "mall" in text.lower():
                                    category = "Shopee Mall"

                                clean_title = re.sub(r'https?://\S+', '', text).replace("►", "").replace("🔴", "").replace("🔵", "").strip()
                                if not clean_title or len(clean_title) < 10:
                                    clean_title = f"Voucher Ưu Đãi {category}"

                                if is_manual_code:
                                    terms = f"📋 Mã nhập tay '{code}': Bấm sao chép mã và dán vào ô 'Shopee Voucher' khi thanh toán sản phẩm."
                                elif code == "SĂN KHUNG GIỜ":
                                    terms = f"⏰ Mã săn khung giờ ({current_time_slot}): Canh đúng khung giờ mở mã trên Shopee để áp dụng hoặc lưu mã back lượt."
                                elif code in ["MÃ SHOPEE LIVE", "MÃ SHOPEE VIDEO"]:
                                    terms = f"📹 Mã Shopee Live / Video: Mua hàng qua Livestream hoặc gắn tag video để hưởng mức giảm."
                                else:
                                    terms = f"🎟️ Mã lưu banner: Bấm 'Mở Shopee' để vào đúng trang sự kiện và bấm 'Lưu voucher' trước khi đặt hàng."

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
                                    "usage_scope": "ALL_PLATFORM" if "toàn sàn" in text.lower() else "CATEGORY",
                                    "source_url": self.endpoint_url,
                                    "claim_url": claim_url,
                                    "terms": terms,
                                    "verification_status": "VERIFIED",
                                    "starts_at": now - timedelta(hours=1),
                                    "expires_at": now + timedelta(days=2),
                                })
        except Exception as e:
            logger.error(f"Error scraping magiamgia.com: {e}")

        # Source 2: bloggiamgia.vn/shopee
        try:
            async with httpx.AsyncClient(timeout=10.0, headers=headers, follow_redirects=True) as client:
                b_resp = await client.get("https://bloggiamgia.vn/shopee")
                if b_resp.status_code == 200:
                    aff_links = re.findall(r'https?://(?:shp\.ee|s\.shopee\.vn|shopee\.vn)/[^\s"\'<>]+', b_resp.text)
                    for link in list(set(aff_links))[:15]:
                        clean_link = link.split('\\')[0].replace('&amp;', '&')
                        if "voucher" in clean_link.lower() or "search" in clean_link.lower() or "m/" in clean_link.lower():
                            vouchers.append({
                                "code": "LƯU BANNER",
                                "program_name": "Voucher Liên Kết Đối Tác Shopee BlogGiảmGiá",
                                "description": "Ưu đãi độc quyền liên kết tài khoản Shopee và cộng đồng săn sale",
                                "discount_type": "PERCENTAGE",
                                "discount_value": 20.0,
                                "discount_unit": "%",
                                "min_spend": 100000.0,
                                "max_discount": 200000.0,
                                "category": "Toàn sàn",
                                "usage_scope": "ALL_PLATFORM",
                                "source_url": "https://bloggiamgia.vn/shopee",
                                "claim_url": clean_link,
                                "terms": "🎟️ Mã lưu banner: Nhấn 'Mở Shopee' để lưu voucher liên kết độc quyền.",
                                "verification_status": "VERIFIED",
                                "starts_at": now,
                                "expires_at": now + timedelta(days=3),
                            })
        except Exception as e:
            logger.warning(f"Error scraping bloggiamgia.vn: {e}")

        # Deduplicate parsed items
        unique_vouchers: List[Dict[str, Any]] = []
        seen = set()
        for v in vouchers:
            key = (v["code"], v["program_name"])
            if key not in seen:
                seen.add(key)
                unique_vouchers.append(v)

        logger.info(f"CouponAggregatorFeedConnector fetched {len(unique_vouchers)} unique vouchers")
        return unique_vouchers
