import urllib.request
import json

OLD_URL = "https://nkyedqekfligqhrnwkqt.supabase.co"
OLD_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5reWVkcWVrZmxpZ3Focm53a3F0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDc2OTgzNiwiZXhwIjoyMDk2MzQ1ODM2fQ._e-_d6iTIwpKD9XM19hkN7Y5jmf31YMgbvQ3O88S0to"

NEW_URL = "https://uqhnlzfbumrcidyfcbcn.supabase.co"
NEW_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxaG5semZidW1yY2lkeWZjYmNuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzAyMTQzNCwiZXhwIjoyMTAyNTk3NDM0fQ.qnanMHq_vmBKQ2NkZClemN8_lciVSIFQjuIjvzdHTIQ"

def get_users(page=1, per_page=100):
    """Get users from old project."""
    url = f"{OLD_URL}/auth/v1/admin/users?page={page}&per_page={per_page}"
    req = urllib.request.Request(url, headers={
        "apikey": OLD_SERVICE_KEY,
        "Authorization": f"Bearer {OLD_SERVICE_KEY}",
    })
    
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            data = json.loads(resp.read().decode())
            return data.get("users", []), data.get("total", 0)
    except Exception as e:
        print(f"Error fetching users: {e}")
        return [], 0

def create_user(user):
    """Create user on new project."""
    url = f"{NEW_URL}/auth/v1/admin/users"
    
    payload = {
        "email": user["email"],
        "email_confirm": True,
        "user_metadata": user.get("user_metadata", {}),
        "app_metadata": user.get("app_metadata", {}),
    }
    
    # If user has phone, include it
    if user.get("phone"):
        payload["phone"] = user["phone"]
    
    data = json.dumps(payload).encode()
    req = urllib.request.Request(url, data=data, method="POST", headers={
        "apikey": NEW_SERVICE_KEY,
        "Authorization": f"Bearer {NEW_SERVICE_KEY}",
        "Content-Type": "application/json",
    })
    
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            result = json.loads(resp.read().decode())
            return True, result.get("id", "unknown")
    except urllib.error.HTTPError as e:
        body = e.read().decode() if e.fp else ""
        return False, f"{e.code}: {body[:200]}"
    except Exception as e:
        return False, str(e)

def main():
    print("Fetching users from old project...")
    all_users = []
    page = 1
    
    while True:
        users, total = get_users(page)
        if not users:
            break
        all_users.extend(users)
        print(f"  Page {page}: {len(users)} users (total: {total})")
        if len(users) < 100 or len(all_users) >= total:
            break
        page += 1
    
    print(f"\nTotal users to migrate: {len(all_users)}")
    
    if not all_users:
        print("No users found!")
        return
    
    # Migrate each user
    success = 0
    failed = 0
    
    for user in all_users:
        email = user.get("email", "unknown")
        print(f"  Migrating {email}...", end=" ")
        
        ok, result = create_user(user)
        if ok:
            print(f"OK (id: {result[:8]}...)")
            success += 1
        else:
            print(f"FAILED: {result}")
            failed += 1
    
    print(f"\nDone! Success: {success}, Failed: {failed}")
    print("\nNOTE: Users will need to reset their passwords via 'Forgot Password' flow.")

if __name__ == "__main__":
    main()
