import sys
import io
import httpx
from bs4 import BeautifulSoup
import re

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

r = httpx.get("https://bloggiamgia.vn/ma-giam-gia/shopee", headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}, timeout=15)
soup = BeautifulSoup(r.text, "html.parser")

# Find buttons or inputs with code
inputs = soup.find_all(['input', 'button', 'span', 'div'], class_=lambda x: x and any(c in str(x).lower() for c in ['code', 'copy', 'btn-copy', 'coupon']))
print(f"Candidate code elements: {len(inputs)}")
for el in inputs[:15]:
    text = el.get_text().strip()
    val = el.get('value') or el.get('data-code') or text
    if val and 3 < len(val) < 25 and not any(w in val.lower() for w in ['xem', 'copy', 'sao chép', 'lấy mã', 'nhập']):
        print(f"  TAG: {el.name} | CLASS: {el.get('class')} | VALUE: {val}")

# Also find text blocks with "Mã:" or "Nhập mã"
text_codes = re.findall(r'(?:nhập mã|mã|code)[:\s]+([A-Z0-9_\-]{4,16})\b', r.text, re.IGNORECASE)
print(f"Regex matching 'Nhập mã: XXX': {len(text_codes)}")
for c in set(text_codes):
    print("  -> REAL CODE:", c)
