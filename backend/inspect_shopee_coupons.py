import sys
import io
import httpx
from bs4 import BeautifulSoup
import re
import json

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

r = httpx.get("https://bloggiamgia.vn/shopee", headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}, follow_redirects=True, timeout=15)
soup = BeautifulSoup(r.text, "html.parser")

# Check for JSON data in script tags
scripts = soup.find_all("script")
print("Total scripts:", len(scripts))

for i, s in enumerate(scripts):
    content = s.string or ""
    if any(k in content.lower() for k in ["coupon_code", "voucher_code", "discount", "min_spend", "coupon"]):
        print(f"Script {i} contains voucher keywords! Length: {len(content)}")
        # Check if it has coupon json list
        matches = re.findall(r'(\{[^{}]*"(?:code|coupon_code|voucher_code)"[^{}]*\})', content)
        if matches:
            print(f"  Found {len(matches)} JSON coupon objects in script {i}!")
            for m in matches[:3]:
                print("  Sample object:", m[:150])

# Also check for coupon cards in HTML
cards = soup.find_all(class_=lambda x: x and any(c in str(x).lower() for c in ['coupon', 'deal', 'voucher']))
print(f"HTML elements with coupon class: {len(cards)}")
for c in cards[:5]:
    print("Class:", c.get("class"), "Text snippet:", c.get_text()[:100].strip())
