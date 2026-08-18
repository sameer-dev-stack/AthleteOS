import urllib.request
import json

NEW_URL = "https://uqhnlzfbumrcidyfcbcn.supabase.co"
NEW_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxaG5semZidW1yY2lkeWZjYmNuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzAyMTQzNCwiZXhwIjoyMTAyNTk3NDM0fQ.qnanMHq_vmBKQ2NkZClemN8_lciVSIFQjuIjvzdHTIQ"

def discover_tables():
    url = f"{NEW_URL}/rest/v1/"
    req = urllib.request.Request(url, headers={
        "apikey": NEW_SERVICE_KEY,
        "Authorization": f"Bearer {NEW_SERVICE_KEY}",
        "Accept": "application/openapi+json",
    })
    
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            spec = json.loads(resp.read().decode())
            paths = spec.get("paths", {})
            tables = [p.strip("/") for p in paths.keys() if p != "/" and not p.startswith("/rpc/")]
            return sorted(tables)
    except Exception as e:
        print(f"Error: {e}")
        return []

tables = discover_tables()
print(f"Tables on new project ({len(tables)}):")
for t in tables:
    print(f"  - {t}")
