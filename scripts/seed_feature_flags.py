import urllib.request
import json

NEW_URL = "https://nkyedqekfligqhrnwkqt.supabase.co"
NEW_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5reWVkcWVrZmxpZ3Focm53a3F0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDc2OTgzNiwiZXhwIjoyMDk2MzQ1ODM2fQ._e-_d6iTIwpKD9XM19hkN7Y5jmf31YMgbvQ3O88S0to"

def seed_feature_flags():
    url = f"{NEW_URL}/rest/v1/feature_flags"
    
    flags = [
        {"flag_name": "onboarding_active", "enabled": True, "description": "Allows new athlete accounts to claim usernames and onboard."},
        {"flag_name": "ai_limitations_enabled", "enabled": True, "description": "Enforces monthly generation quotas per tier (Free/Pro)."},
        {"flag_name": "automatic_compliance_review", "enabled": False, "description": "Enables AI to auto-screen deals before human compliance audit."},
        {"flag_name": "platform_tipping_enabled", "enabled": True, "description": "Allows public card profiles to display the Stripe TIP support modal."},
        {"flag_name": "payout_instant_withdrawals", "enabled": False, "description": "Enables instant debit payouts to connected bank debit cards."},
    ]
    
    for flag in flags:
        data = json.dumps(flag).encode()
        req = urllib.request.Request(url, data=data, method="POST", headers={
            "apikey": NEW_SERVICE_KEY,
            "Authorization": f"Bearer {NEW_SERVICE_KEY}",
            "Content-Type": "application/json",
            "Prefer": "return=representation",
        })
        try:
            with urllib.request.urlopen(req, timeout=30) as resp:
                result = json.loads(resp.read().decode())
                print(f"  Seeded '{flag['flag_name']}': {result[0]['flag_name']} = {result[0]['enabled']}")
        except urllib.error.HTTPError as e:
            body = e.read().decode() if e.fp else ""
            if "duplicate key" in body.lower() or "409" in str(e.code):
                print(f"  '{flag['flag_name']}' already exists, updating...")
                # Update instead
                update_url = f"{NEW_URL}/rest/v1/feature_flags?flag_name=eq.{flag['flag_name']}"
                update_data = json.dumps({"enabled": flag["enabled"], "updated_at": "now()"}).encode()
                req2 = urllib.request.Request(update_url, data=update_data, method="PATCH", headers={
                    "apikey": NEW_SERVICE_KEY,
                    "Authorization": f"Bearer {NEW_SERVICE_KEY}",
                    "Content-Type": "application/json",
                })
                try:
                    with urllib.request.urlopen(req2, timeout=30) as resp2:
                        print(f"  Updated '{flag['flag_name']}' = {flag['enabled']}")
                except Exception as e2:
                    print(f"  Update failed: {e2}")
            else:
                print(f"  Error seeding '{flag['flag_name']}': {e.code} - {body[:100]}")

def verify_flags():
    url = f"{NEW_URL}/rest/v1/feature_flags"
    req = urllib.request.Request(url, headers={
        "apikey": NEW_SERVICE_KEY,
        "Authorization": f"Bearer {NEW_SERVICE_KEY}",
    })
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            flags = json.loads(resp.read().decode())
            print(f"\nCurrent feature flags ({len(flags)}):")
            for f in flags:
                print(f"  {f['flag_name']}: {f['enabled']}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    print("Seeding feature flags...")
    seed_feature_flags()
    verify_flags()
