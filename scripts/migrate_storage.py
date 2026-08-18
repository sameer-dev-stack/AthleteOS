import urllib.request
import json
import re

OLD_URL = "https://nkyedqekfligqhrnwkqt.supabase.co"
OLD_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5reWVkcWVrZmxpZ3Focm53a3F0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDc2OTgzNiwiZXhwIjoyMDk2MzQ1ODM2fQ._e-_d6iTIwpKD9XM19hkN7Y5jmf31YMgbvQ3O88S0to"

NEW_URL = "https://uqhnlzfbumrcidyfcbcn.supabase.co"
NEW_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxaG5semZidW1yY2lkeWZjYmNuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzAyMTQzNCwiZXhwIjoyMTAyNTk3NDM0fQ.qnanMHq_vmBKQ2NkZClemN8_lciVSIFQjuIjvzdHTIQ"

def fetch_old(query):
    url = f"{OLD_URL}/rest/v1/{query}"
    req = urllib.request.Request(url, headers={
        "apikey": OLD_SERVICE_KEY,
        "Authorization": f"Bearer {OLD_SERVICE_KEY}",
    })
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            return json.loads(resp.read().decode())
    except Exception as e:
        print(f"Error: {e}")
        return []

def extract_storage_path(url):
    """Extract bucket/path from a Supabase storage URL."""
    if not url:
        return None, None
    # Match pattern: https://PROJECT.supabase.co/storage/v1/object/public/BUCKET/PATH
    match = re.search(r'/object/public/([^/]+)/(.+)$', url)
    if match:
        return match.group(1), match.group(2)
    # Try signed URL pattern
    match = re.search(r'/object/sign/([^/]+)/(.+)\?', url)
    if match:
        return match.group(1), match.group(2)
    return None, None

def download_file(bucket, path):
    url = f"{OLD_URL}/storage/v1/object/{bucket}/{path}"
    req = urllib.request.Request(url, headers={
        "apikey": OLD_SERVICE_KEY,
        "Authorization": f"Bearer {OLD_SERVICE_KEY}",
    })
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            return resp.read()
    except Exception as e:
        print(f"  Download error for {path}: {e}")
        return None

def upload_file(bucket, path, data):
    url = f"{NEW_URL}/storage/v1/object/{bucket}/{path}"
    req = urllib.request.Request(url, data=data, method="POST", headers={
        "apikey": NEW_SERVICE_KEY,
        "Authorization": f"Bearer {NEW_SERVICE_KEY}",
    })
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            return True
    except Exception as e:
        print(f"  Upload error for {path}: {e}")
        return False

def main():
    # Get all profiles with avatar_url or cover_url
    profiles = fetch_old("profiles?select=id,avatar_url,cover_url")
    
    if not profiles:
        print("No profiles found")
        return
    
    files_to_migrate = set()
    
    for p in profiles:
        for field in ["avatar_url", "cover_url"]:
            url = p.get(field)
            bucket, path = extract_storage_path(url)
            if bucket and path:
                files_to_migrate.add((bucket, path))
    
    print(f"Found {len(files_to_migrate)} unique files to migrate")
    
    migrated = 0
    failed = 0
    
    for bucket, path in sorted(files_to_migrate):
        print(f"  {bucket}/{path}...", end=" ")
        
        data = download_file(bucket, path)
        if data is None:
            print("DOWNLOAD FAILED")
            failed += 1
            continue
        
        if upload_file(bucket, path, data):
            print(f"OK ({len(data)} bytes)")
            migrated += 1
        else:
            print("UPLOAD FAILED")
            failed += 1
    
    print(f"\nDone! Migrated: {migrated}, Failed: {failed}")

if __name__ == "__main__":
    main()
