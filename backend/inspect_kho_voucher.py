import sys
import io
import httpx
from bs4 import BeautifulSoup

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

r = httpx.get("https://bloggiamgia.vn/kho-voucher-shopee", headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}, follow_redirects=True, timeout=15)
print("kho-voucher-shopee status:", r.status_code, "Length:", len(r.text))
soup = BeautifulSoup(r.text, "html.parser")
print("Title:", soup.title.string if soup.title else "No title")

# Check if there is an API or data table
tables = soup.find_all("table")
print("Tables found:", len(tables))

# Look for voucher cards
cards = soup.find_all(class_=lambda x: x and any(c in str(x).lower() for c in ['voucher', 'coupon', 'item', 'deal']))
print("Cards found:", len(cards))
for c in cards[:5]:
    print("Class:", c.get("class"), "Text:", c.get_text()[:80].strip())
