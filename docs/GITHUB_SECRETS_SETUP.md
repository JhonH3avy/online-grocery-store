# GitHub Secrets Configuration for Database Workflows

This document explains how to set up GitHub Secrets for the database migration and seeding workflows.

## Required Secrets

### 1. PRODUCTION_DATABASE_URL
For your Azure PostgreSQL database, use this format:
```
postgresql://[username]:[password]@[host].postgres.database.azure.com/[database]?sslmode=require
```

**Key changes needed:**
- Added `?sslmode=require` - This is REQUIRED for Azure PostgreSQL
- Removed `?schema=public` - Not needed for Azure PostgreSQL connections
- Replace `[username]`, `[password]`, `[host]`, and `[database]` with your actual values

### 2. DEVELOPMENT_DATABASE_URL (Optional)
For local development database:
```
postgresql://postgres:password@localhost:5432/grocery_store_db?schema=public
```

### 3. STAGING_DATABASE_URL (Optional)
If you have a staging environment, format similar to production:
```
postgresql://[username]:[password]@[staging-host]/[database]?sslmode=require
```

## How to Add Secrets to GitHub

1. Go to your GitHub repository
2. Click **Settings** tab
3. Click **Secrets and variables** → **Actions**
4. Click **New repository secret**
5. Add each secret:
   - Name: `PRODUCTION_DATABASE_URL`
   - Value: `postgresql://[username]:[password]@[host].postgres.database.azure.com/[database]?sslmode=require`

## Azure PostgreSQL SSL Requirements

Azure PostgreSQL databases **require** SSL connections for security. The connection will fail with:
```
❌ no pg_hba.conf entry for host "x.x.x.x", user "username", database "dbname", no encryption
```

**Solution:** Always include `?sslmode=require` in Azure PostgreSQL connection strings.

## SSL Mode Options

- `sslmode=disable` - No SSL (use only for local development)
- `sslmode=require` - Require SSL but don't verify certificates (good for Azure)
- `sslmode=verify-ca` - Require SSL and verify certificate authority
- `sslmode=verify-full` - Require SSL and verify full certificate chain

For Azure PostgreSQL, use `sslmode=require`.

## Testing Connection

To test your connection string locally:
```bash
# Set the Azure connection string (replace with your actual credentials)
$env:DATABASE_URL="postgresql://[username]:[password]@[host].postgres.database.azure.com/[database]?sslmode=require"

# Test migration
npm run db:migrate

# Test seeding  
npm run db:seed
```

## Troubleshooting

### Error: "no encryption"
- **Problem:** Missing `sslmode=require` parameter
- **Solution:** Add `?sslmode=require` to connection string

### Error: "database does not exist"
- **Problem:** Database name mismatch
- **Solution:** Verify database name in Azure portal

### Error: "authentication failed"
- **Problem:** Wrong username/password
- **Solution:** Check credentials in Azure portal

### Error: "connection timeout"
- **Problem:** Network/firewall issues
- **Solution:** Check Azure firewall rules, allow GitHub Actions IP ranges