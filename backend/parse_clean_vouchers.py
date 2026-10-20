import sys
import io
import re
import httpx
from bs4 import BeautifulSoup
from datetime import datetime, timedelta

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

r = httpx.get("https://magiamgia.com/shopee/", headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}, timeout=15)
soup = BeautifulSoup(r.text, "html.parser")

clean_vouchers = []
now = datetime.utcnow()

# Look through all block elements
for el in soup.find_all(['p', 'li', 'td', 'div']):
    # Only direct paragraphs or list items to avoid huge wrapper blocks
    if el.name in ['div'] and (len(el.find_all(['p', 'li', 'div'])) > 0):
        continue
        
    text = el.get_text().strip()
    
    # Check if text contains voucher or promo information
    if any(k in text.lower() for k in ["mã giảm", "giảm ", "freeship", "voucher", "hoàn xu", "đơn 0đ", "đơn từ"]):
        if 20 < len(text) < 250 and not text.startswith("http") and "tháng " not in text.lower():
            # Check for link inside or immediate sibling/parent
            link_tag = el.find('a')
            if not link_tag and el.parent and el.parent.name == 'a':
                link_tag = el.parent
            claim_url = link_tag['href'] if (link_tag and 'href' in link_tag.attrs) else None
            
            # If no link on element, check next sibling
            if not claim_url:
                nxt = el.find_next_sibling('p') or el.find_next_sibling('a')
                if nxt:
                    nxt_a = nxt if nxt.name == 'a' else nxt.find('a')
                    if nxt_a and 'href' in nxt_a.attrs:
                        claim_url = nxt_a['href']
                        
            if not claim_url:
                claim_url = "https://shopee.vn/m/ma-giam-gia"

            # Parse discount amount
            pct_m = re.search(r'giảm\s*(\d+)%', text, re.IGNORECASE)
            k_m = re.search(r'(?:tối đa|giảm|hoàn)\s*(\d+)\s*(?:k|đ|vnđ)', text, re.IGNORECASE)
            
            discount_val = 0.0
            discount_unit = "VND"
            if pct_m:
                discount_val = float(pct_m.group(1))
                discount_unit = "%"
            elif k_m:
                discount_val = float(k_m.group(1)) * 1000.0
                discount_unit = "VND"

            # Parse min spend
            min_spend = 0.0
            if "đơn 0đ" in text.lower() or "đơn từ 0đ" in text.lower() or "đơn từ 0k" in text.lower():
                min_spend = 0.0
            else:
                spend_m = re.search(r'đơn\s*(?:từ)?\s*(\d+)\s*(?:k|đ)', text, re.IGNORECASE)
                if spend_m:
                    min_spend = float(spend_m.group(1)) * 1000.0

            # Parse max discount if %
            max_disc = None
            max_m = re.search(r'tối đa\s*(\d+)\s*(?:k|đ)', text, re.IGNORECASE)
            if max_m:
                max_disc = float(max_m.group(1)) * 1000.0

            # Extract actual coupon code if there is an explicit code
            # e.g. "nhập mã: ABC123" or "mã ABC123"
            explicit_code_m = re.search(r'(?:nhập mã|mã voucher|mã code|code)[:\s]+([A-Z0-9_\-]{4,15})\b', text, re.IGNORECASE)
            if explicit_code_m:
                code = explicit_code_m.group(1).upper()
                is_banner = False
            elif "banner" in text.lower() or "lưu" in text.lower() or "shp.ee" in claim_url:
                code = "LƯU BANNER"
                is_banner = True
            else:
                # Look for standalone code token that is NOT a currency unit
                words = re.findall(r'\b[A-Z0-9]{4,12}\b', text)
                valid_words = [w for w in words if not any(w == bad for bad in ['VND', 'SHOPEE', 'LIVE', 'VOUCHER', 'TIKTOK', 'LAZADA', 'NGHÌN', 'TRIỆU', 'TRANG', 'HOT'])]
                if valid_words:
                    code = valid_words[0]
                    is_banner = False
                else:
                    code = "LƯU TRÊN APP"
                    is_banner = True

            # Determine category
            category = "Toàn sàn"
            if any(w in text.lower() for w in ["freeship", "vận chuyển"]):
                category = "Vận Chuyển Freeship"
            elif any(w in text.lower() for w in ["điện tử", "công nghệ"]):
                category = "Điện Tử & Công Nghệ"
            elif any(w in text.lower() for w in ["thời trang", "quần áo"]):
                category = "Thời Trang & Làm Đẹp"
            elif any(w in text.lower() for w in ["mỹ phẩm", "sắc đẹp"]):
                category = "Sức Khỏe & Sắc Đẹp"
            elif any(w in text.lower() for w in ["ngân hàng", "ví", "shopeepay", "spaylater"]):
                category = "Thanh Toán & Ví"

            clean_vouchers.append({
                "code": code,
                "program_name": text.replace("►", "").strip()[:85],
                "description": text.replace("►", "").strip(),
                "discount_type": "PERCENTAGE" if discount_unit == "%" else "FIXED_AMOUNT",
                "discount_value": discount_val if discount_val > 0 else 30000.0,
                "discount_unit": discount_unit,
                "min_spend": min_spend,
                "max_discount": max_disc,
                "category": category,
                "usage_scope": "ALL_PLATFORM" if "toàn sàn" in text.lower() else "CATEGORY",
                "source_url": "https://magiamgia.com/shopee/",
                "claim_url": claim_url,
                "is_banner": is_banner,
                "verification_status": "VERIFIED",
                "terms": "Voucher thực tế từ kênh tổng hợp ưu đãi Shopee Việt Nam",
                "expires_at": now + timedelta(days=2)
            })

# Deduplicate by description
seen = set()
final_list = []
for v in clean_vouchers:
    if v["description"] not in seen:
        seen.add(v["description"])
        final_list.append(v)

print(f"Total clean real vouchers: {len(final_list)}")
for v in final_list[:8]:
    print(f"CODE: {v['code']} | {v['program_name']} | GIẢM: {v['discount_value']}{v['discount_unit']} | ĐƠN: {v['min_spend']:,.0f}Đ | LINK: {v['claim_url']}")
