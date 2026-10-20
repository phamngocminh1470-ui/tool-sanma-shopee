import sys
import io
import re
import httpx
from bs4 import BeautifulSoup

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

r = httpx.get('https://magiamgia.com/shopee/', headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}, timeout=15)
soup = BeautifulSoup(r.text, 'html.parser')

tab_titles = [t.get_text().strip() for t in soup.find_all('div', class_='elementor-tab-title')]
contents = soup.find_all('div', class_='elementor-tab-content')

extracted = []

# Exclude list of words that are definitely not coupon codes
NON_CODE_WORDS = {
    'GIẢM', 'VND', 'SHOPEE', 'VOUCHER', 'FLASH', 'SALE', 'BANNER', 'TRANG', 'LIST', 
    'TIKTOK', 'LAZADA', 'TIKI', 'BACK', 'LƯỢT', 'NGÀY', 'THÁNG', 'INSTAGRAM', 'FACEBOOK', 
    'TRENDY', 'TOPPING', 'FREESHIP', 'MUA', 'ĐƠN', 'TOÀN', 'SÀN', 'XTRA', 'XU', 'HOÀN', 
    'SHOP', 'MALL', 'LIVE', 'VIDEO', 'HÔM', 'NAY', 'CHỈ', 'TỐI', 'ĐA', 'MÃ', 'HOT',
    'YOUTUBE', 'BÁCH', 'HÓA', 'ĐIỆN', 'TỬ', 'THỜI', 'TRANG'
}

for i in range(min(4, len(contents))):
    tab_title = tab_titles[i] if i < len(tab_titles) else f"Tab {i}"
    tab_content = contents[i]
    
    current_time_slot = "Hàng ngày"
    
    for el in tab_content.find_all(['p', 'li']):
        text = el.get_text().strip()
        if not text or len(text) < 15:
            continue
            
        # Skip informational noise
        if any(bad in text.lower() for bad in ["hướng dẫn", "mẹo săn", "lưu ý:", "app nô tì", "tải app", "group để", "xem ngay"]):
            continue
            
        # Extract time slot if mentioned
        time_m = re.search(r'►?\s*(\d+H(?:[,\s\w\-]+)?):', text, re.IGNORECASE)
        if time_m:
            current_time_slot = time_m.group(1).strip()
            
        # Check if text describes a voucher/promo
        if any(w in text.lower() for w in ["giảm", "hoàn xu", "freeship", "voucher", "áp mã"]):
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
            if pct_m:
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
            explicit_m = re.search(r'(?:nhập mã|mã voucher|mã code|code)[:\s]+([A-Z0-9_\-]{4,15})\b', text, re.IGNORECASE)
            if explicit_m:
                cand = explicit_m.group(1).upper()
                if cand not in NON_CODE_WORDS and len(cand) >= 4:
                    code = cand

            is_banner = False
            voucher_type = "INPUT_CODE"
            if not code:
                # Classify by channel and mechanism
                if "live" in tab_title.lower() or "live" in text.lower():
                    code = "MÃ SHOPEE LIVE"
                    voucher_type = "LIVE_DROP"
                    is_banner = True
                elif "video" in tab_title.lower() or "video" in text.lower():
                    code = "MÃ SHOPEE VIDEO"
                    voucher_type = "VIDEO_DROP"
                    is_banner = True
                elif "banner" in text.lower() or "lưu banner" in text.lower():
                    code = "LƯU BANNER"
                    voucher_type = "BANNER_CLAIM"
                    is_banner = True
                elif any(h in text.lower() for h in ["9h", "12h", "15h", "18h", "20h", "21h"]):
                    code = "SĂN KHUNG GIỜ"
                    voucher_type = "FLASH_DROP"
                    is_banner = True
                else:
                    code = "LƯU TRÊN APP"
                    voucher_type = "APP_EXCLUSIVE"
                    is_banner = True

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

            extracted.append({
                "source_name": "magiamgia.com (Shopee Official Daily Feed)",
                "tab": tab_title,
                "time_slot": current_time_slot,
                "code": code,
                "voucher_type": voucher_type,
                "is_banner": is_banner,
                "title": text.replace("►", "").strip(),
                "discount_value": disc_val,
                "discount_unit": disc_unit,
                "min_spend": min_spend,
                "max_discount": max_disc,
                "category": category,
                "claim_url": claim_url
            })

print(f"Total extracted deals: {len(extracted)}")
for d in extracted[:12]:
    print(f"[{d['code']}] ({d['voucher_type']}) | {d['title'][:60]} | GIẢM: {d['discount_value']}{d['discount_unit']} | ĐƠN: {d['min_spend']:,.0f}đ | URL: {d['claim_url'][:60]}")
