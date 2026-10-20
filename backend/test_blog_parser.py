import sys
import io
import re
import httpx
from bs4 import BeautifulSoup

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

r = httpx.get('https://bloggiamgia.vn/shopee', headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}, follow_redirects=True, timeout=15)

# Extract any HTML blocks inside next_f push scripts
scripts = re.findall(r'self\.__next_f\.push\(\[1,"(.*)"\]\)', r.text)
print(f"Next.js stream blocks: {len(scripts)}")

# Unescape all unicode characters in the stream
full_stream = "".join(scripts).encode('utf-8').decode('unicode_escape', errors='ignore')

# Now search for deal containers or patterns in full_stream
soup = BeautifulSoup(full_stream, 'html.parser')
p_tags = soup.find_all(['p', 'li', 'div', 'tr'])

deals = []
for p in p_tags:
    t = p.get_text().strip()
    if 25 < len(t) < 250 and any(k in t.lower() for k in ["giảm ", "freeship", "voucher", "đơn từ", "đơn 0đ", "hoàn xu"]):
        a = p.find('a')
        href = a['href'] if a and 'href' in a.attrs else ''
        if not any(bad in t.lower() for bad in ["mã giảm giá shopee là gì", "điều kiện", "cách sử dụng", "tại sao"]):
            deals.append((t, href))

# Deduplicate
unique_deals = []
seen = set()
for t, h in deals:
    if t not in seen:
        seen.add(t)
        unique_deals.append((t, h))

print(f"Clean deals found in bloggiamgia: {len(unique_deals)}")
for t, h in unique_deals[:10]:
    print(f"DEAL: {t[:80]} | LINK: {h[:60]}")
