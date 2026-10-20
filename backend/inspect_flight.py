import sys
import io
import httpx
from bs4 import BeautifulSoup
import re
import json

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

r = httpx.get("https://bloggiamgia.vn/shopee", headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}, follow_redirects=True, timeout=15)
text = r.text

# Search for voucher keywords in flight payload
discounts = re.findall(r'\\"[^\\"]*(?:giảm|freeship|hoàn xu|voucher|toàn sàn)[^\\"]*\\"', text, re.IGNORECASE)
print(f"Found {len(discounts)} voucher mentions in Next.js Flight payload:")
for d in list(dict.fromkeys(discounts))[:10]:
    print(" ->", d.replace('\\"', ''))

# Also search for API routes called by Next.js
api_calls = re.findall(r'/(?:api|v[0-9])/[\w/-]+', text)
print("API routes found in code:", set(api_calls[:15]))
