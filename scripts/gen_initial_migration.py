import urllib.request
import json
import os

OLD_URL = "https://nkyedqekfligqhrnwkqt.supabase.co"
OLD_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5reWVkcWVrZmxpZ3Focm53a3F0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDc2OTgzNiwiZXhwIjoyMDk2MzQ1ODM2fQ._e-_d6iTIwpKD9XM19hkN7Y5jmf31YMgbvQ3O88S0to"

def get_openapi_spec():
    url = f"{OLD_URL}/rest/v1/"
    req = urllib.request.Request(url, headers={
        "apikey": OLD_SERVICE_KEY,
        "Authorization": f"Bearer {OLD_SERVICE_KEY}",
        "Accept": "application/openapi+json",
    })
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read().decode())

def generate_migration(spec):
    definitions = spec.get("definitions", {})
    paths = spec.get("paths", {})
    
    # Filter actual tables (not rpc functions)
    tables = {}
    for path in paths:
        if path == "/" or path.startswith("/rpc/"):
            continue
        table_name = path.strip("/")
        if table_name in definitions:
            tables[table_name] = definitions[table_name]
    
    # Generate SQL in dependency order (parents first based on FK analysis)
    ordered = [
        "profiles",           # Core table
        "social_accounts",
        "ai_usage",
        "ai_events",
        "athlete_ai_memory",
        "audit_log",
        "page_views",
        "link_clicks",
        "referral_codes",
        "referrals",
        "referral_clicks",
        "nil_value_metrics",
        "tips",
        "waitlist",
        "newsletter",
        "business_facts",
        "payouts",
        "team_accounts",
        "team_members",
        "team_invites",
        "brand_accounts",
        "campaign_briefs",
        "inquiries",
        "saved_athletes",
        "rate_limits",
    ]
    
    sql_parts = []
    
    for table_name in ordered:
        if table_name not in tables:
            continue
        
        table_def = tables[table_name]
        properties = table_def.get("properties", {})
        
        columns = []
        for col_name, col_def in properties.items():
            col_type = col_def.get("type", "text")
            format_type = col_def.get("format", "")
            default = col_def.get("default", "")
            is_required = col_name in table_def.get("required", [])
            max_length = col_def.get("maxLength")
            enum_vals = col_def.get("enum")
            
            # Map types
            if format_type == "uuid":
                pg_type = "uuid"
            elif format_type == "timestamp with time zone":
                pg_type = "timestamptz"
            elif format_type == "timestamp without time zone":
                pg_type = "timestamp"
            elif format_type == "date":
                pg_type = "date"
            elif col_type == "integer":
                pg_type = "integer"
            elif col_type == "number":
                pg_type = "numeric"
            elif col_type == "boolean":
                pg_type = "boolean"
            elif col_type == "array":
                pg_type = "jsonb"
            elif col_type == "object":
                pg_type = "jsonb"
            elif col_type == "string":
                if max_length:
                    pg_type = f"text"
                else:
                    pg_type = "text"
            else:
                pg_type = "text"
            
            col_sql = f"  {col_name} {pg_type}"
            
            # Add DEFAULT
            if default:
                if default == "gen_random_uuid()":
                    col_sql += " DEFAULT gen_random_uuid()"
                elif default == "now()":
                    col_sql += " DEFAULT now()"
                elif isinstance(default, str):
                    col_sql += f" DEFAULT '{default}'"
                else:
                    col_sql += f" DEFAULT {default}"
            
            if is_required:
                col_sql += " NOT NULL"
            
            columns.append(col_sql)
        
        # Add PRIMARY KEY on 'id' if present
        if "id" in properties:
            columns.append("  PRIMARY KEY (id)")
        
        sql = f"CREATE TABLE IF NOT EXISTS {table_name} (\n"
        sql += ",\n".join(columns)
        sql += "\n);"
        sql_parts.append(sql)
    
    return "\n\n".join(sql_parts)

def main():
    spec = get_openapi_spec()
    migration_sql = generate_migration(spec)
    
    # Write to migrations
    os.makedirs("supabase/migrations", exist_ok=True)
    with open("supabase/migrations/20260101000000_initial_schema.sql", "w") as f:
        f.write("-- Initial schema dump from old project\n")
        f.write("-- Auto-generated from OpenAPI spec\n\n")
        f.write(migration_sql)
    
    print("Created supabase/migrations/20260101000000_initial_schema.sql")
    print(f"Total tables: {migration_sql.count('CREATE TABLE')}")

if __name__ == "__main__":
    main()
