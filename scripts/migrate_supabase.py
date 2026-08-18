import urllib.request
import urllib.error
import json

OLD_URL = "https://nkyedqekfligqhrnwkqt.supabase.co"
OLD_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5reWVkcWVrZmxpZ3Focm53a3F0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDc2OTgzNiwiZXhwIjoyMDk2MzQ1ODM2fQ._e-_d6iTIwpKD9XM19hkN7Y5jmf31YMgbvQ3O88S0to"

NEW_URL = "https://uqhnlzfbumrcidyfcbcn.supabase.co"
NEW_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxaG5semZidW1yY2lkeWZjYmNuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzAyMTQzNCwiZXhwIjoyMTAyNTk3NDM0fQ.qnanMHq_vmBKQ2NkZClemN8_lciVSIFQjuIjvzdHTIQ"

def discover_tables():
    """Use the OpenAPI endpoint to discover all tables in old project."""
    url = f"{OLD_URL}/rest/v1/"
    req = urllib.request.Request(url, headers={
        "apikey": OLD_SERVICE_KEY,
        "Authorization": f"Bearer {OLD_SERVICE_KEY}",
        "Accept": "application/openapi+json",
    })
    
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            spec = json.loads(resp.read().decode())
            # Extract table paths from the spec
            paths = spec.get("paths", {})
            tables = [p.strip("/") for p in paths.keys() if p != "/"]
            return tables
    except Exception as e:
        print(f"Error discovering tables: e")
        return []

def fetch_table_data(table, offset=0, limit=1000):
    """Fetch all rows from a table with pagination."""
    url = f"{OLD_URL}/rest/v1/{table}?select=*&limit={limit}&offset={offset}"
    req = urllib.request.Request(url, headers={
        "apikey": OLD_SERVICE_KEY,
        "Authorization": f"Bearer {OLD_SERVICE_KEY}",
        "Prefer": "count=exact",
    })
    
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            data = json.loads(resp.read().decode())
            return data
    except urllib.error.HTTPError as e:
        body = e.read().decode() if e.fp else ""
        print(f"  Error: {e.code} - {body[:200]}")
        return None
    except Exception as e:
        print(f"  Error: {e}")
        return None

def insert_data(table, rows):
    """Insert rows into new project."""
    url = f"{NEW_URL}/rest/v1/{table}"
    data = json.dumps(rows).encode()
    req = urllib.request.Request(url, data=data, method="POST", headers={
        "apikey": NEW_SERVICE_KEY,
        "Authorization": f"Bearer {NEW_SERVICE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal,resolution=merge-duplicates",
    })
    
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            return True
    except urllib.error.HTTPError as e:
        body = e.read().decode() if e.fp else ""
        print(f"  Insert error: {e.code} - {body[:300]}")
        return False

def main():
    # Step 1: Discover tables
    print("Discovering tables from old project...")
    tables = discover_tables()
    print(f"Found tables: {tables}")
    
    if not tables:
        print("Could not discover tables. Trying common table names...")
        tables = [
            "profiles", "social_accounts", "ai_usage", "ai_generations", "audit_log",
            "page_views", "link_clicks", "nil_deals", "nil_value_metrics", "tips",
            "waitlist", "newsletter", "referrals", "referral_clicks", "teams",
            "team_roles", "payout_methods", "payouts", "feature_flags",
            "email_preferences", "business_facts", "deal_room_inquiries",
            "fan_content", "schedule", "milestones", "notifications", "balance",
            "tip_verification", "compliance", "athlete_knowledge", "first_500_pro"
        ]
    
    # Step 2: Fetch and migrate each table
    total = 0
    for table in tables:
        print(f"\nMigrating {table}...")
        all_rows = []
        offset = 0
        
        while True:
            rows = fetch_table_data(table, offset)
            if rows is None:
                print(f"  Could not fetch {table} - table may not exist")
                break
            if not rows:
                break
            all_rows.extend(rows)
            if len(rows) < 1000:
                break
            offset += 1000
            print(f"  Fetched {len(all_rows)} rows...")
        
        if not all_rows:
            print(f"  No data in {table}")
            continue
        
        print(f"  Total {len(all_rows)} rows. Inserting...")
        
        # Insert in batches
        batch_size = 100
        for i in range(0, len(all_rows), batch_size):
            batch = all_rows[i:i+batch_size]
            if insert_data(table, batch):
                print(f"  Inserted batch {i//batch_size + 1}")
            else:
                print(f"  Failed batch {i//batch_size + 1}")
        
        total += len(all_rows)
    
    print(f"\nDone! Total rows migrated: {total}")

if __name__ == "__main__":
    main()
