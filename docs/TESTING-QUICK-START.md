# Integration Tests - Quick Reference

## What Was Added

### Files Created
- `vitest.config.ts` - Vitest configuration
- `tests/setup.ts` - Test environment initialization
- `tests/helpers.ts` - API call utilities and helpers
- `tests/api.test.ts` - 24 integration tests
- `tests/README.md` - Test documentation
- `run-tests.sh` - Convenient test runner script
- `docs/TESTING.md` - Complete testing guide

### Dependencies Added
- `vitest` - Lightweight test runner
- `@vitest/ui` - Test UI (optional)
- `node-fetch` - HTTP client for tests

### npm Scripts Added
```json
{
  "test": "npm run test:static",
  "test:static": "MODE=static TEST_BASE_URL=http://localhost:3000 vitest run",
  "test:prisma": "MODE=prisma TEST_BASE_URL=http://localhost:3000 vitest run",
  "test:watch": "MODE=static TEST_BASE_URL=http://localhost:3000 vitest --watch"
}
```

---

## Running Tests - Quick Commands

### Static Mode (No Database)

```bash
# Terminal 1: Start dev server
CATALOG_READ_SOURCE=static npm run dev

# Terminal 2: Run tests
npm run test:static
```

### Prisma Mode (With Database)

```bash
# Terminal 1: Start dev server
DATABASE_URL='postgresql://postgres:Ezenagu101@127.0.0.1:5432/charme_local?schema=public' \
CATALOG_READ_SOURCE=prisma \
npm run dev

# Terminal 2: Run tests
npm run test:prisma
```

### Watch Mode

```bash
# Terminal 1: Start dev server (static or prisma)
CATALOG_READ_SOURCE=static npm run dev

# Terminal 2: Run tests in watch mode
npm run test:watch
```

### Using the Test Runner Script

```bash
./run-tests.sh static    # Run tests in static mode
./run-tests.sh prisma    # Run tests in prisma mode
./run-tests.sh watch     # Run tests in watch mode
```

---

## Test Coverage

### 24 Tests Total

**Menu API Tests (5)**
- Returns menu items
- Items have required fields
- Valid pricing
- Consistent responses
- Categories included

**Cart Add API Tests (7)**
- Add item to cart
- Correct total calculation
- Required response fields
- Validation: missing owner
- Validation: quantity limit
- Deduplication of items
- New items added to existing cart

**Cart Get API Tests (12)**
- Non-existent cart returns null
- Cart after adding item
- Required cart fields
- Correct cart totals
- Multiple items tracking
- Validation: missing owner
- Clear cart functionality
- Separate carts per guest

---

## Test Modes

### Static Mode
- ✅ No database required
- ✅ In-memory cart storage
- ✅ Seeded catalog (80 items)
- ✅ Perfect for development
- ✅ Tests run in ~2-3 seconds

### Prisma Mode
- ✅ Requires PostgreSQL
- ✅ Database-backed cart
- ✅ Database catalog
- ✅ Production-like behavior
- ✅ Tests run in ~3-5 seconds

---

## What Each Test File Does

### `tests/setup.ts`
- Initializes test environment
- Reads `MODE` and `TEST_BASE_URL` env vars
- Waits for dev server to be ready
- Times out if server doesn't respond after 20 retries

### `tests/helpers.ts`
- `apiCall()` - Generic HTTP request wrapper
- `getMenu()` - GET /api/menu
- `addToCart()` - POST /api/cart/add
- `getCart()` - GET /api/cart
- `clearCart()` - DELETE /api/cart
- `generateGuestId()` - Creates unique test IDs

### `tests/api.test.ts`
- 3 test suites (Menu API, Cart Add API, Cart Get API)
- 24 individual test cases
- Tests positive cases (happy path)
- Tests negative cases (validation, errors)
- Each test gets a fresh guest ID for isolation

### `vitest.config.ts`
- Configures Vitest
- Sets up globals, environment, includes patterns
- Defines test timeout (30 seconds)
- Maps `@` alias to `src/`

---

## Environment Variables

| Variable | Default | Purpose |
|----------|---------|---------|
| `MODE` | `static` | Controls test logging (not test behavior) |
| `TEST_BASE_URL` | `http://localhost:3000` | Where to send API requests |
| `CATALOG_READ_SOURCE` | `prisma` | Set on dev server (static or prisma) |
| `DATABASE_URL` | - | Set on dev server (for Prisma mode) |

---

## Troubleshooting

### Tests Timeout
- Ensure dev server is running in another terminal
- Check it's on the right port (default 3000)
- Run `curl http://localhost:3000/api/menu` to verify

### Port Already in Use
```bash
lsof -i :3000 | grep LISTEN | awk '{print $2}' | xargs kill -9
```

### Prisma Tests Fail
- Verify PostgreSQL is running: `psql -h 127.0.0.1 -U postgres -d charme_local -c "SELECT 1;"`
- Verify database is seeded: `psql -h 127.0.0.1 -U postgres -d charme_local -c "SELECT COUNT(*) FROM menu;"`

### Wrong Mode Running
- Set env var BEFORE command: `CATALOG_READ_SOURCE=static npm run dev`
- NOT after: `npm run dev CATALOG_READ_SOURCE=static` (won't work)

---

## Manual API Testing

You can also test endpoints manually without running the full test suite:

```bash
# Get menu
curl http://localhost:3000/api/menu | jq .

# Add to cart
curl -X POST http://localhost:3000/api/cart/add \
  -H "Content-Type: application/json" \
  -d '{"guestId":"test-1","menuItemId":"spring-rolls","productVariantId":"default","quantity":1}' | jq .

# Get cart
curl http://localhost:3000/api/cart?guestId=test-1 | jq .

# Clear cart
curl -X DELETE http://localhost:3000/api/cart \
  -H "Content-Type: application/json" \
  -d '{"guestId":"test-1"}' | jq .
```

---

## Key Features

✅ **Works in both modes** - Static (no-DB) and Prisma (with-DB)  
✅ **Test isolation** - Each test uses unique guest ID  
✅ **Easy to run** - Single npm command  
✅ **Watch mode** - Automatically rerun on changes  
✅ **Clear logging** - Knows which mode is running  
✅ **Fast execution** - 2-5 seconds for all 24 tests  
✅ **No test data cleanup needed** - Automatic via unique IDs  

---

## Next Steps

1. Read `docs/SETUP.md` for environment setup details
2. Read `docs/TESTING.md` for complete testing guide
3. Read `tests/README.md` for test-specific documentation
4. Try running tests: `npm run test:static`
5. Add more tests as features are implemented

---

## References

- Vitest docs: https://vitest.dev
- Next.js testing: https://nextjs.org/docs/testing
- Current setup: `vitest.config.ts`, `tests/`, `package.json`
