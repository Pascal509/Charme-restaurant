# Development Setup Guide

This guide explains how to run the Charme Restaurant application in different modes and troubleshoot common issues.

## Quick Start

### Static Mode (No Database Required)

Run the application with an in-memory cart and seeded catalog:

```bash
CATALOG_READ_SOURCE=static npm run dev
```

**What this does:**
- Loads menu items from seeded static data
- Stores cart items in-memory (no persistence)
- Zero database dependency
- Perfect for offline development and testing

**Behavior:**
- Browse menu → Add items to cart → View cart all work without database
- Cart data is lost when the server restarts
- All catalog pricing is read from static data

---

### Prisma Mode (Database Required)

Run the application with a PostgreSQL database backend:

```bash
DATABASE_URL='postgresql://postgres:Ezenagu101@127.0.0.1:5432/charme_local?schema=public' \
DIRECT_URL='postgresql://postgres:Ezenagu101@127.0.0.1:5432/charme_local?schema=public' \
CATALOG_READ_SOURCE=prisma \
npm run dev
```

**What this does:**
- Reads menu items from PostgreSQL database
- Stores cart items in database (persistent)
- Full ORM integration with Prisma
- Production-ready database operations

**Prerequisites:**
- PostgreSQL server running at `127.0.0.1:5432`
- Database credentials: `postgres` / `Ezenagu101`
- Database created: `charme_local`
- Schema: `public`

---

## Environment Variables

### Required Variables

| Variable | Values | Purpose |
|----------|--------|---------|
| `CATALOG_READ_SOURCE` | `static` \| `prisma` | Determines whether to use in-memory or database catalog |

### Optional Variables (Prisma Mode)

| Variable | Example | Purpose |
|----------|---------|---------|
| `DATABASE_URL` | `postgresql://...` | Database connection string for Prisma ORM |
| `DIRECT_URL` | `postgresql://...` | Direct database URL (bypasses connection pooler) |

### Default Values

- `CATALOG_READ_SOURCE`: If not set, defaults to `prisma` mode (with fallback to static if DB is unreachable)
- `BASE_CURRENCY`: `NGN` (Nigerian Naira)
- `PORT`: `3000`

---

## Local PostgreSQL Setup

If you need to set up PostgreSQL locally for Prisma mode:

### Start PostgreSQL (Docker)

```bash
docker run --name charme-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=Ezenagu101 \
  -p 5432:5432 \
  -d postgres:15
```

### Create Database and Seed

```bash
# Create the database
createdb -h 127.0.0.1 -U postgres charme_local

# Run migrations
npx prisma migrate deploy

# Seed initial data (80 menu items, 54 variants)
npx prisma db seed
```

### Verify Connection

```bash
psql -h 127.0.0.1 -U postgres -d charme_local -c "SELECT COUNT(*) FROM menu;"
```

---

## Mode Comparison

| Feature | Static Mode | Prisma Mode |
|---------|------------|-------------|
| Database Required | ❌ No | ✅ Yes |
| Cart Persistence | ❌ No (in-memory) | ✅ Yes (DB) |
| Catalog Source | Seeded data | PostgreSQL |
| Startup Time | ~4s | ~5s (with DB check) |
| Data Volume | 80 items | Unlimited (DB) |
| Ideal For | Development, testing | Production, persistent data |

---

## Common Errors and Fixes

### Static Mode Issues

#### ❌ `[CartService] Running in PRISMA mode` (but I set CATALOG_READ_SOURCE=static)

**Problem:** Environment variable not being read.

**Solution:**
```bash
# Make sure to set it BEFORE npm run dev
CATALOG_READ_SOURCE=static npm run dev

# NOT:
npm run dev CATALOG_READ_SOURCE=static  # This won't work
```

**Check it's set:**
```bash
echo $CATALOG_READ_SOURCE  # Should print: static
```

---

#### ❌ Cart returns `null` after adding items

**Problem:** Using different guestId on subsequent requests.

**Solution:**
```bash
# Add item
curl -X POST http://localhost:3000/api/cart/add \
  -H "Content-Type: application/json" \
  -d '{"guestId":"user-123","menuItemId":"spring-rolls","productVariantId":"default","quantity":1}'

# Get cart with SAME guestId
curl http://localhost:3000/api/cart?guestId=user-123

# NOT a different guestId - each guestId has its own in-memory cart
```

---

#### ❌ "Quantity exceeds limit" error

**Problem:** Trying to add more than 20 of one item.

**Solution:**
- Maximum quantity per cart item is 20
- Keep `quantity` ≤ 20 in add-to-cart requests

---

### Prisma Mode Issues

#### ❌ `Can't reach database server at 127.0.0.1:5432`

**Problem:** PostgreSQL not running or wrong host.

**Solution:**
```bash
# Check if PostgreSQL is running
psql -h 127.0.0.1 -U postgres -d charme_local -c "SELECT 1;"

# If it fails, start PostgreSQL:
docker start charme-postgres  # If using Docker

# Or check your local installation:
brew services start postgresql  # macOS
sudo systemctl start postgresql  # Linux
```

---

#### ❌ `FATAL: (ENOTFOUND) tenant/user postgres.xxx not found`

**Problem:** Using Supabase connection string instead of local.

**Solution:**
```bash
# WRONG (Supabase):
DATABASE_URL='postgresql://postgres:xxx@aws-1-eu-west-1.pooler.supabase.com:6543/postgres'

# CORRECT (Local):
DATABASE_URL='postgresql://postgres:Ezenagu101@127.0.0.1:5432/charme_local?schema=public'
```

---

#### ❌ `Foreign key constraint violated: CartItem_menuItemId_fkey`

**Problem:** Menu item doesn't exist in database.

**Solution:**
1. Verify menu is seeded: `psql -h 127.0.0.1 -U postgres -d charme_local -c "SELECT id FROM menu LIMIT 5;"`
2. Use a valid menuItemId from the query above
3. Re-seed if needed: `npx prisma db seed`

---

#### ❌ Database connection times out on every request

**Problem:** Connection pool exhausted or slow query.

**Solution:**
```bash
# Use DIRECT_URL to bypass pooler:
DATABASE_URL='postgresql://...' \
DIRECT_URL='postgresql://...' \
CATALOG_READ_SOURCE=prisma \
npm run dev
```

---

### Build Issues

#### ❌ `'Prisma' is defined but never used`

**Problem:** Unused import in TypeScript.

**Solution:**
```bash
npm run lint --fix
```

---

#### ❌ `Failed to compile` with multiple errors

**Problem:** Stale .next build cache.

**Solution:**
```bash
# Clean build
rm -rf .next
npm run build

# Or run dev with clean cache
rm -rf .next && npm run dev
```

---

## API Testing

### Add Item to Cart

```bash
# Static mode example
curl -X POST http://localhost:3000/api/cart/add \
  -H "Content-Type: application/json" \
  -d '{
    "guestId": "guest-001",
    "menuItemId": "spring-rolls",
    "productVariantId": "default",
    "quantity": 2
  }'
```

### Get Cart

```bash
curl http://localhost:3000/api/cart?guestId=guest-001
```

### Clear Cart

```bash
curl -X DELETE http://localhost:3000/api/cart \
  -H "Content-Type: application/json" \
  -d '{"guestId": "guest-001"}'
```

### List Menu

```bash
curl http://localhost:3000/api/menu
```

### Debug Catalog

```bash
# See which catalog service is active
curl http://localhost:3000/api/_debug/catalog
```

---

## Troubleshooting Checklist

- [ ] Check `CATALOG_READ_SOURCE` is set correctly
- [ ] Verify `npm run build` succeeds (catches TypeScript errors early)
- [ ] Check server logs for `[CartService]` mode indicator
- [ ] Confirm correct `guestId` is used in GET requests
- [ ] For Prisma: verify PostgreSQL is running
- [ ] For Prisma: verify database credentials in `DATABASE_URL`
- [ ] Clear .next build cache if seeing stale errors
- [ ] Check API port (default 3000, can change with PORT env var)

---

## Production Notes

For production deployment:

1. **Always use Prisma mode** with a managed PostgreSQL service (Supabase, AWS RDS, etc.)
2. **Use connection pooling** (PgBouncer, Supabase pooler, etc.)
3. **Set `DIRECT_URL`** to bypass pooler for migrations
4. **Use strong credentials** - never use `Ezenagu101`
5. **Enable SSL** - use `?sslmode=require` in DATABASE_URL
6. **Monitor connection pools** - check for leaks
7. **Static mode is development-only** - never use in production

---

## Getting Help

If you encounter issues:

1. Check the logs for `[CartService]` and `[CatalogService]` indicators
2. Look for specific error messages in "Common Errors" above
3. Verify environment variables with `env | grep -i catalog`
4. Test API endpoints manually with curl (see "API Testing")
5. Check that prerequisites are installed: Node.js 18+, PostgreSQL 12+ (if using Prisma)
