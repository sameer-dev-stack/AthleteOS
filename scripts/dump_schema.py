import urllib.request
import json

OLD_URL = "https://nkyedqekfligqhrnwkqt.supabase.co"
OLD_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5reWVkcWVrZmxpZ3Focm53a3F0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDc2OTgzNiwiZXhwIjoyMDk2MzQ1ODM2fQ._e-_d6iTIwpKD9XM19hkN7Y5jmf31YMgbvQ3O88S0to"

def get_openapi_spec():
    """Get the OpenAPI spec from old project."""
    url = f"{OLD_URL}/rest/v1/"
    req = urllib.request.Request(url, headers={
        "apikey": OLD_SERVICE_KEY,
        "Authorization": f"Bearer {OLD_SERVICE_KEY}",
        "Accept": "application/openapi+json",
    })
    
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            return json.loads(resp.read().decode())
    except Exception as e:
        print(f"Error: {e}")
        return None

def generate_create_table(spec):
    """Generate CREATE TABLE statements from OpenAPI spec."""
    definitions = spec.get("definitions", {})
    paths = spec.get("paths", {})
    
    # Get table definitions
    tables = {}
    for path in paths:
        if path == "/" or path.startswith("/rpc/"):
            continue
        table_name = path.strip("/")
        if table_name not in definitions:
            continue
        tables[table_name] = definitions[table_name]
    
    # Generate SQL
    sql_statements = []
    for table_name, table_def in tables.items():
        properties = table_def.get("properties", {})
        required = table_def.get("required", [])
        
        columns = []
        for col_name, col_def in properties.items():
            col_type = col_def.get("type", "text")
            format_type = col_def.get("format", "")
            default = col_def.get("default", "")
            is_required = col_name in required
            
            # Map OpenAPI types to PostgreSQL
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
            else:
                pg_type = "text"
            
            col_sql = f"  {col_name} {pg_type}"
            if is_required:
                col_sql += " NOT NULL"
            if default:
                col_sql += f" DEFAULT {default}"
            
            columns.append(col_sql)
        
        sql = f"CREATE TABLE IF NOT EXISTS {table_name} (\n"
        sql += ",\n".join(columns)
        sql += "\n);"
        sql_statements.append(sql)
    
    return sql_statements

def main():
    print("Fetching OpenAPI spec from old project...")
    spec = get_openapi_spec()
    if not spec:
        return
    
    print("Generating CREATE TABLE statements...")
    statements = generate_create_table(spec)
    
    # Save to file
    with open("tmp/schema.sql", "w") as f:
        for stmt in statements:
            f.write(stmt + "\n\n")
    
    print(f"Generated {len(statements)} CREATE TABLE statements")
    print("Saved to tmp/schema.sql")
    
    # Print first few
    for stmt in statements[:3]:
        print(f"\n{stmt}")

if __name__ == "__main__":
    main()
