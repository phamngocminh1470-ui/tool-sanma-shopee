import sys
import io
import httpx
from bs4 import BeautifulSoup
import re
import json

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

sources = [
    ("bloggiamgia", "https://bloggiamgia.vn/ma-giam-gia/shopee"),
    ("chanhtuoi", "https://chanhtuoi.com/ma-giam-gia-shopee"),
    ("tiereviews", "https://tiereviews.com/ma-giam-gia-shopee/"),
    ("giamgiatonghop", "https://giamgiatonghop.com/ma-giam-gia-shopee/"),
    ("magiamgiashopee", "https://magiamgia.com/shopee/"),
]

for name, url in sources:
    try:
        r = httpx.get(url, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}, timeout=10, follow_redirects=True)
        print(f"[{name}] Status: {r.status_code}, Length: {len(r.text)}")
        
        # Check for API endpoints in the page script
        apis = re.findall(r'https?://[^\s"\']+(?:api|coupon|voucher|feed)[^\s"\']+', r.text)
        if apis:
            print(f"  Found potential API URLs ({len(apis)}):", apis[:3])
    except Exception as e:
        print(f"[{name}] Error: {e}")
