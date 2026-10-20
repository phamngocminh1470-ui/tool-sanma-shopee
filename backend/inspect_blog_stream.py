import sys
import io
import httpx
import re
import json

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

r = httpx.get('https://bloggiamgia.vn/shopee', headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}, follow_redirects=True, timeout=15)

# Search for coupon structures in Next.js flight data
print("Total HTML length:", len(r.text))

# Search for coupon codes or promo objects
found_codes = re.findall(r'"code"\s*:\s*"([A-Za-z0-9_-]{3,20})"', r.text)
print("Found codes:", len(found_codes), set(found_codes[:20]))

# Search for title or description
found_titles = re.findall(r'"title"\s*:\s*"([^"]{10,100})"', r.text)
print("Found titles:", len(found_titles))
for t in found_titles[:10]:
    print("  Title:", t)

# Look for shp.ee or shopee.vn links
aff_links = re.findall(r'https?://(?:shp\.ee|s\.shopee\.vn|shopee\.vn)/[^\s"\'<>]+', r.text)
print("Found Shopee affiliate/deal links:", len(aff_links))
for l in list(set(aff_links))[:10]:
    print("  Link:", l)
