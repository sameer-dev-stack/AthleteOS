import urllib.request
import json
import re
import mimetypes

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
        print(f"Error fetching {query}: {e}")
        return []

def extract_storage_path(url):
    """Extract bucket/path from a Supabase storage URL, stripping query params."""
    if not url:
        return None, None
    url_no_query = url.split("?")[0]
    match = re.search(r'/object/public/([^/]+)/(.+)$', url_no_query)
    if match:
        return match.group(1), match.group(2)
    match = re.search(r'/object/sign/([^/]+)/(.+)$', url_no_query)
    if match:
        return match.group(1), match.group(2)
    return None, None

def guess_content_type(path):
    """Guess MIME type from file extension."""
    ct, _ = mimetypes.guess_type(path)
    if ct and ct != "application/octet-stream":
        return ct
    # Explicit fallbacks for common image formats
    lower = path.lower()
    if lower.endswith(".webp"):
        return "image/webp"
    if lower.endswith(".jpg") or lower.endswith(".jpeg"):
        return "image/jpeg"
    if lower.endswith(".png"):
        return "image/png"
    if lower.endswith(".gif"):
        return "image/gif"
    if lower.endswith(".svg"):
        return "image/svg+xml"
    return "application/octet-stream"

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
    content_type = guess_content_type(path)
    
    req = urllib.request.Request(
        url,
        data=data,
        method="POST",
        headers={
            "apikey": NEW_SERVICE_KEY,
            "Authorization": f"Bearer {NEW_SERVICE_KEY}",
            "Content-Type": content_type,
            "x-upsert": "true",  # Upsert to handle duplicates
        }
    )
    
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            return True
    except urllib.error.HTTPError as e:
        body = e.read().decode() if e.fp else ""
        # 409 Duplicate is OK when upsert is enabled
        if e.code == 409 and "Duplicate" in body:
            print(f"  (already exists, skipping)")
            return True
        print(f"  Upload HTTP {e.code} for {path}: {body[:200]}")
        return False
    except Exception as e:
        print(f"  Upload error for {path}: {e}")
        return False

def main():
    print("Fetching profiles with storage URLs...")
    profiles = fetch_old("profiles?select=id,avatar_url,cover_url")
    
    if not profiles:
        print("No profiles found")
        return
    
    files_to_migrate = []
    seen = set()
    
    for p in profiles:
        for field in ["avatar_url", "cover_url"]:
            url = p.get(field)
            bucket, path = extract_storage_path(url)
            if bucket and path and (bucket, path) not in seen:
                seen.add((bucket, path))
                files_to_migrate.append((bucket, path))
    
    print(f"Found {len(files_to_migrate)} unique files to migrate\n")
    
    migrated = 0
    skipped = 0
    failed = 0
    
    for bucket, path in sorted(files_to_migrate):
        print(f"{bucket}/{path}")
        print(f"  Downloading...", end=" ")
        
        data = download_file(bucket, path)
        if data is None:
            print("FAILED")
            failed += 1
            continue
        
        print(f"{len(data)} bytes", end=" ")
        
        if upload_file(bucket, path, data):
            print("OK")
            migrated += 1
        else:
            print("FAILED")
            failed += 1
    
    print(f"\n{'='*50}")
    print(f"Migrated: {migrated}")
    print(f"Skipped (already exists): {skipped}")
    print(f"Failed: {failed}")
    print(f"Total: {len(files_to_migrate)}")

if __name__ == "__main__":
    main()
