import sys
import io
import httpx
from bs4 import BeautifulSoup
import re

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
r = httpx.get("https://magiamgia.com/shopee/", headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}, timeout=15)
soup = BeautifulSoup(r.text, "html.parser")

lines = []
for p in soup.find_all(['p', 'li', 'td', 'h3', 'h4']):
    text = p.get_text().strip()
    if any(k in text.lower() for k in ["mã giảm", "giảm ", "freeship", "voucher", "hoàn xu", "đơn từ", "đơn 0đ", "áp dụng"]):
        if 15 < len(text) < 250:
            lines.append(text)

unique_lines = list(dict.fromkeys(lines))
print(f"Total matching deal lines: {len(unique_lines)}")
for l in unique_lines[:15]:
    print("VOUCHER FOUND:", l)
