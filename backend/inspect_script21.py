import sys
import io
import httpx
from bs4 import BeautifulSoup
import re
import json

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

r = httpx.get("https://bloggiamgia.vn/shopee", headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}, follow_redirects=True, timeout=15)
soup = BeautifulSoup(r.text, "html.parser")
scripts = soup.find_all("script")
script_content = scripts[21].string or ""

print("Script 21 preview:", script_content[:300])

# Try to find JSON array or window.__NUXT__ or similar state
if "window.__NUXT__" in script_content or "__NEXT_DATA__" in script_content:
    print("Found Nuxt/Next state!")
else:
    # Look for variable assignment e.g. var data = [...] or let coupons = [...]
    var_matches = re.findall(r'(?:var|let|const)\s+([a-zA-Z0-9_]+)\s*=\s*(\[.*?\]|\{.*?\});', script_content, re.DOTALL)
    print(f"Found {len(var_matches)} variable declarations")
    for name, val in var_matches[:5]:
        print(f"Var: {name}, Length: {len(val)}")

# Let's search for "code": "..." patterns
code_patterns = re.findall(r'"code"\s*:\s*"([A-Za-z0-9_-]+)"', script_content)
print(f"Found exact 'code': '...' matches: {len(code_patterns)}")
print("Sample codes:", set(code_patterns[:20]))

# Search for voucher titles or amounts
titles = re.findall(r'"title"\s*:\s*"([^"]+)"', script_content)
print(f"Found exact 'title': '...' matches: {len(titles)}")
for t in set(titles[:15]):
    print("  Title:", t)
