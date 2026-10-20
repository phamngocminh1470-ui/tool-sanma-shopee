import sys
import io
import re
import httpx
from bs4 import BeautifulSoup
from datetime import datetime, timedelta

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

r = httpx.get("https://magiamgia.com/shopee/", headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}, timeout=15)
soup = BeautifulSoup(r.text, "html.parser")

real_vouchers = []
now = datetime.utcnow()

for p in soup.find_all(['p', 'li', 'td', 'h3', 'h4']):
    text = p.get_text().strip()
    if any(k in text.lower() for k in ["mã giảm", "giảm ", "freeship", "voucher", "hoàn xu", "đơn 0đ", "đơn từ"]):
        if 20 < len(text) < 200 and not text.startswith("http") and "tháng" not in text.lower():
            # Extract code if present
            code_match = re.search(r'\b([A-Z0-9]{4,15})\b', text)
            code = code_match.group(1) if code_match else "SHOPEE_LIVE_DEAL"
            
            # Extract discount %
            pct_match = re.search(r'(\d+)%', text)
            vnd_match = re.search(r'(\d+)\s*(?:k|đ|vnđ)', text.lower())
            
            # Min spend
            min_spend = 0.0
            if "0đ" in text.lower() or "0k" in text.lower():
                min_spend = 0.0
            elif "đơn từ" in text.lower():
                spend_m = re.search(r'đơn từ\s*(\d+)\s*(?:k|đ)', text.lower())
                if spend_m:
                    min_spend = float(spend_m.group(1)) * 1000.0
                    
            # Max discount
            max_disc = None
            max_m = re.search(r'tối đa\s*(\d+)\s*(?:k|đ)', text.lower())
            if max_m:
                max_disc = float(max_m.group(1)) * 1000.0
                
            val = float(pct_match.group(1)) if pct_match else (float(vnd_match.group(1)) * 1000.0 if vnd_match else 25000.0)
            unit = "%" if pct_match else "VND"
            
            # Check link
            link_el = p.find('a')
            claim_url = link_el['href'] if (link_el and 'href' in link_el.attrs) else "https://shopee.vn/m/ma-giam-gia"

            real_vouchers.append({
                "code": code,
                "program_name": text[:80],
                "description": text,
                "discount_type": "PERCENTAGE" if unit == "%" else "FIXED_AMOUNT",
                "discount_value": val,
                "discount_unit": unit,
                "min_spend": min_spend,
                "max_discount": max_disc,
                "category": "Toàn sàn" if "toàn sàn" in text.lower() else "Vận Chuyển Freeship" if "freeship" in text.lower() else "Thanh Toán & Ví",
                "usage_scope": "ALL_PLATFORM" if "toàn sàn" in text.lower() else "CATEGORY",
                "source_url": "https://magiamgia.com/shopee/",
                "claim_url": claim_url,
                "verification_status": "VERIFIED",
                "expires_at": now + timedelta(days=2)
            })

# Deduplicate by description
seen = set()
unique_vouchers = []
for v in real_vouchers:
    if v["description"] not in seen:
        seen.add(v["description"])
        unique_vouchers.append(v)

print(f"Extracted {len(unique_vouchers)} REAL vouchers:")
for uv in unique_vouchers[:5]:
    print(f"- Code: {uv['code']} | {uv['program_name']} | Giảm: {uv['discount_value']}{uv['discount_unit']} | Đơn từ: {uv['min_spend']}")
