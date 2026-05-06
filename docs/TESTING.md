# API Integration Testing - Full Guide

Complete guide to running integration tests for the Charme Restaurant API in both static (no-DB) and prisma (database) modes.

## What Gets Tested

**API Endpoints:**
- ✅ GET `/api/menu` - Menu listing
- ✅ POST `/api/cart/add` - Add item to cart
- ✅ GET `/api/cart` - Retrieve cart
- ✅ DELETE `/api/cart` - Clear cart

**Modes:**
- ✅ Static mode (in-memory cart, no database)
- ✅ Prisma mode (database-backed cart, requires PostgreSQL)

**Test Cases:** 24 total
- Menu: 5 tests
- Cart Add: 7 tests  
- Cart Get: 12 tests

## Prerequisites

### For All Tests
- Node.js 18+ (for native `fetch` support)
- npm 8+

### For Prisma Mode Tests Only
- PostgreSQL 12+ running on `127.0.0.1:5432`
- Database: `charme_local`
- User: `postgres` / Password: `Ezenagu101`

## Step-by-Step: Running Tests

### Scenario 1: Test Static Mode (No Database)

**Step 1: Start the dev server**
```bash
CATALOG_READ_SOURCE=static npm run dev
```

You'll see:
```
✓ Ready in 4.2s
[CatalogService] Using StaticCatalogService (seeded catalog)
[CartService] Running in STATIC mode (in-memory cart, no database)
```

**Step 2: In a new terminal, run tests**
```bash
npm run test:static
```

**Expected output:**
```
✓ Menu API (/api/menu) (5 tests)
✓ Cart Add API (/api/cart/add) (7 tests)  
✓ Cart Get API (/api/cart) (12 tests)

✓ 24 tests passed (2.5s)
```

**Troubleshooting:**
- If tests timeout: Check that dev server is running and showing logs
- If tests fail with 500 errors: Check console for stack traces in dev server terminal

---

### Scenario 2: Test Prisma Mode (With Database)

**Prerequisites: Start PostgreSQL**

If using Docker:
```bash
docker start charme-postgres
```

If using local installation:
```bash
brew services start postgresql  # macOS
sudo systemctl start postgresql  # Linux
```

Verify connection:
```bash
psql -h 127.0.0.1 -U postgres -d charme_local -c "SELECT COUNT(*) FROM menu;"
```

Should return: `count: 80` (or similar number of menu items)

**Step 1: Start the dev server in Prisma mode**
```bash
DATABASE_URL='postgresql://postgres:Ezenagu101@127.0.0.1:5432/charme_local?schema=public' \
DIRECT_URL='postgresql://postgres:Ezenagu101@127.0.0.1:5432/charme_local?schema=public' \
CATALOG_READ_SOURCE=prisma \
npm run dev
```

You'll see:
```
✓ Ready in 5.3s
[CatalogService] Using PrismaCatalogService (DB-backed catalog)
[CatalogService] Prisma read source enabled and database reachable
[CartService] Running in PRISMA mode (database-backed cart)
```

**Step 2: In a new terminal, run tests**
```bash
npm run test:prisma
```

**Expected output:**
```
✓ Menu API (/api/menu) (5 tests)
✓ Cart Add API (/api/cart/add) (7 tests)
✓ Cart Get API (/api/cart) (12 tests)

✓ 24 tests passed (2.5s)
```

---

### Scenario 3: Watch Mode (Continuous Testing)

**Step 1: Start dev server**
```bash
CATALOG_READ_SOURCE=static npm run dev
```

**Step 2: In a new terminal, run tests in watch mode**
```bash
npm run test:watch
```

Tests will automatically rerun when you:
- Modify test files
- Modify API endpoints
- Restart the dev server

---

## Using the Test Runner Script

Convenience script that shows helpful messages:

**Static mode:**
```bash
./run-tests.sh static
```

**Prisma mode:**
```bash
./run-tests.sh prisma
```

**Watch mode:**
```bash
./run-tests.sh watch
```

## Environment Variables

| Variable | Default | Used By | Example |
|----------|---------|---------|---------|
| `MODE` | `static` | Test setup (logging) | `MODE=prisma npm run test:prisma` |
| `TEST_BASE_URL` | `http://localhost:3000` | Test helpers (API calls) | `TEST_BASE_URL=http://localhost:3001 npm run test:static` |
| `TEST_PORT` | `3000` | Test setup | `TEST_PORT=3001` |
| `CATALOG_READ_SOURCE` | `prisma` | Dev server | `CATALOG_READ_SOURCE=static npm run dev` |
| `DATABASE_URL` | - | Dev server (Prisma) | `postgresql://...` |
| `DIRECT_URL` | - | Dev server (Prisma migrations) | `postgresql://...` |

## API Test Examples

### Manual Testing (Without Running Full Test Suite)

Get the menu:
```bash
curl http://localhost:3000/api/menu | jq .
```

Add item to cart:
```bash
curl -X POST http://localhost:3000/api/cart/add \
  -H "Content-Type: application/json" \
  -d '{"guestId":"test-guest-1","menuItemId":"spring-rolls","productVariantId":"default","quantity":1}' | jq .
```

Get cart:
```bash
curl http://localhost:3000/api/cart?guestId=test-guest-1 | jq .
```

Clear cart:
```bash
curl -X DELETE http://localhost:3000/api/cart \
  -H "Content-Type: application/json" \
  -d '{"guestId":"test-guest-1"}' | jq .
```

## Test Isolation & Cleanup

Each test uses a unique `guestId`:
```typescript
beforeEach(() => {
  guestId = generateGuestId();  // e.g., "test-guest-1234567890-a1b2c3d"
});
```

This ensures:
- ✅ Tests don't interfere with each other
- ✅ No need to clean up between tests
- ✅ Cart data is isolated per test

## Common Issues & Fixes

### Tests Timeout (Server Not Ready)

**Problem:** 
```
Server not ready after 20 retries at http://localhost:3000
```

**Fix:**
```bash
# Check dev server is running
curl http://localhost:3000/api/menu

# If it fails, make sure dev server is still running in another terminal
CATALOG_READ_SOURCE=static npm run dev

# Or use a different port if 3000 is taken
npm run dev -- --port 3001
TEST_BASE_URL=http://localhost:3001 npm run test:static
```

---

### Port Already in Use

**Problem:**
```
Error: listen EADDRINUSE: address already in use :::3000
```

**Fix:**
```bash
# Find and kill the process
lsof -i :3000 | grep LISTEN | awk '{print $2}' | xargs kill -9

# Or start on a different port
npm run dev -- --port 3001
```

---

### Can't Reach Database (Prisma Mode)

**Problem:**
```
Can't reach database server at 127.0.0.1:5432
```

**Fix:**
```bash
# Check PostgreSQL is running
psql -h 127.0.0.1 -U postgres -d charme_local -c "SELECT 1;"

# If command fails, start PostgreSQL
docker start charme-postgres  # Docker
sudo systemctl start postgresql  # Linux
brew services start postgresql  # macOS
```

---

### Database Not Seeded (Prisma Mode)

**Problem:**
```
Foreign key constraint violated: CartItem_menuItemId_fkey
```

**Fix:**
```bash
# Re-seed the database
npx prisma db seed

# Verify menu has items
psql -h 127.0.0.1 -U postgres -d charme_local -c "SELECT COUNT(*) FROM menu;"
```

---

### Wrong Mode Running

**Problem:** Console shows "Running in PRISMA mode" but you wanted static

**Fix:**
```bash
# Set env var BEFORE the command (not after)
CATALOG_READ_SOURCE=static npm run dev

# NOT: npm run dev CATALOG_READ_SOURCE=static  (wrong!)

# Verify it's set
echo $CATALOG_READ_SOURCE  # Should print: static
```

---

## Comparing Test Results Between Modes

Run tests in both modes and compare:

```bash
# Terminal 1: Static mode
CATALOG_READ_SOURCE=static npm run dev

# Terminal 2: Static tests
npm run test:static > static-results.txt 2>&1

# Terminal 3: Kill Terminal 1 and start Prisma mode
DATABASE_URL='postgresql://...' CATALOG_READ_SOURCE=prisma npm run dev

# Terminal 2: Prisma tests
npm run test:prisma > prisma-results.txt 2>&1

# Compare results
diff static-results.txt prisma-results.txt
```

Both should pass all 24 tests.

## CI/CD Integration

For continuous integration pipelines:

```bash
# Run only fast static mode tests (no DB setup needed)
CATALOG_READ_SOURCE=static npm run dev -- --port 3000 &
sleep 3
npm run test:static
```

Or with Docker:

```yaml
# GitHub Actions example
test:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v3
    - uses: actions/setup-node@v3
    - run: npm ci
    - run: npm run build
    - run: |
        CATALOG_READ_SOURCE=static npm run dev -- --port 3000 &
        sleep 3
        npm run test:static
```

## Performance & Timing

Typical execution times:

| Mode | Time | Includes |
|------|------|----------|
| Static | 2-3s | 24 tests |
| Prisma | 3-5s | 24 tests + DB queries |
| Watch (rerun) | 1-2s | Only changed tests |

Server startup: ~4-5s per mode

## Extending the Tests

To add more tests, create a new suite in `tests/api.test.ts`:

```typescript
describe('New Feature', () => {
  it('should work', async () => {
    const guestId = generateGuestId();
    const { status, data } = await addToCart({
      guestId,
      menuItemId: 'item-id',
      productVariantId: 'default',
      quantity: 1,
    });
    expect(status).toBe(201);
  });
});
```

The new test will automatically run in both modes.

## Summary

✅ **24 automated tests** covering cart and menu APIs  
✅ **Runs in both static and prisma modes**  
✅ **No cross-test contamination** (unique guest IDs)  
✅ **Easy to run** (npm scripts + test runner script)  
✅ **Clear error messages** when issues occur  
✅ **Fast execution** (2-5 seconds)  

Use these tests to verify the app works correctly in your desired mode before deploying!
