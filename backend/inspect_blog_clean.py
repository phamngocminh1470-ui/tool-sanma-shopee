import sys
import io
import httpx
import re

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

r = httpx.get('https://bloggiamgia.vn/shopee', headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}, follow_redirects=True, timeout=15)

# Find all blocks of promotions
# E.g. find all strings that look like "giảm ... đơn ..."
items = re.findall(r'(?:►|👉|🔥|📌)?\s*([^\n\r"<>]{10,120}?(?:giảm|voucher|hoàn xu|freeship)[^\n\r"<>]{10,120})', r.text, re.IGNORECASE)
print(f"Extracted promotion snippets from bloggiamgia: {len(items)}")

for it in set(items[:15]):
    print("  ->", it.strip())
