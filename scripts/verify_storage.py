import urllib.request
import json

NEW_URL = "https://uqhnlzfbumrcidyfcbcn.supabase.co"
NEW_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxaG5semZidW1yY2lkeWZjYmNuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzAyMTQzNCwiZXhwIjoyMTAyNTk3NDM0fQ.qnanMHq_vmBKQ2NkZClemN8_lciVSIFQjuIjvzdHTIQ"

def list_objects(bucket):
    url = f"{NEW_URL}/storage/v1/object/list/{bucket}"
    data = json.dumps({"prefix": "", "limit": 1000}).encode()
    req = urllib.request.Request(url, data=data, method="POST", headers={
        "apikey": NEW_SERVICE_KEY,
        "Authorization": f"Bearer {NEW_SERVICE_KEY}",
        "Content-Type": "application/json",
    })
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            return json.loads(resp.read().decode())
    except Exception as e:
        print(f"  Error: {e}")
        return []

print("New project storage verification:")
for bucket in ["avatars", "covers"]:
    print(f"\n{bucket}/")
    objs = list_objects(bucket)
    if not objs:
        print("  (empty or inaccessible)")
        continue
    # Show first level keys
    top_keys = sorted(set(o.get("name", "").split("/")[0] for o in objs if o.get("name")))
    for k in top_keys[:5]:
        print(f"  {k}/")
    print(f"  ... {len(objs)} objects total")
