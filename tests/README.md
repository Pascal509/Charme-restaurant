# API Integration Tests

Lightweight integration tests for the Charme Restaurant API endpoints using Vitest.

## Overview

Tests cover the critical API endpoints:
- `/api/menu` - Menu listing
- `/api/cart/add` - Add item to cart
- `/api/cart` - Get/clear cart

Tests run in **both modes**:
- **Static mode** - No database dependency
- **Prisma mode** - With local PostgreSQL

## Quick Start

### Option 1: Using npm scripts (Recommended)

**Static Mode - Terminal 1:**
```bash
CATALOG_READ_SOURCE=static npm run dev
```

**Static Mode - Terminal 2:**
```bash
npm run test:static
```

---

**Prisma Mode - Terminal 1:**
```bash
DATABASE_URL='postgresql://postgres:Ezenagu101@127.0.0.1:5432/charme_local?schema=public' \
DIRECT_URL='postgresql://postgres:Ezenagu101@127.0.0.1:5432/charme_local?schema=public' \
CATALOG_READ_SOURCE=prisma \
npm run dev
```

**Prisma Mode - Terminal 2:**
```bash
npm run test:prisma
```

### Option 2: Using the test runner script

```bash
# Terminal 1: Start server in static mode
CATALOG_READ_SOURCE=static npm run dev

# Terminal 2: Run tests
./run-tests.sh static
```

Or for watch mode:
```bash
./run-tests.sh watch
```

### Watch Mode

While the dev server is running in another terminal:
```bash
npm run test:watch
```

Or using the script:
```bash
./run-tests.sh watch
```

## Test Structure

```
tests/
├── setup.ts           # Test environment setup & server health check
├── helpers.ts         # Shared API call utilities & helper functions
├── api.test.ts        # Menu, Cart Add, Cart Get integration tests
└── README.md          # This file
```

### File Purposes

**setup.ts**
- Initializes test environment
- Reads MODE and TEST_BASE_URL from env variables
- Waits for server to be ready before running tests
- Validates /api/menu endpoint is accessible

**helpers.ts**
- `apiCall()` - Generic HTTP request wrapper
- `getMenu()` - GET /api/menu
- `addToCart()` - POST /api/cart/add
- `getCart()` - GET /api/cart
- `clearCart()` - DELETE /api/cart
- `removeCartItem()` - DELETE /api/cart/item/:id
- `updateCartItemQuantity()` - PUT /api/cart/item/:id
- `generateGuestId()` - Creates unique test guest IDs (prevents test cross-contamination)

**api.test.ts**
- 24 test cases across 3 test suites
- Tests both positive cases (happy path) and negative cases (validation)
- Uses fresh guest ID for each test to avoid state pollution

### Root Level Files

- `vitest.config.ts` - Vitest configuration
- `run-tests.sh` - Helper script to run tests

## Test Coverage

### Menu API Tests
- ✅ Returns menu items
- ✅ Items have required fields (id, name, slug, description, price)
- ✅ Valid pricing
- ✅ Consistent responses
- ✅ Categories included

### Cart Add API Tests
- ✅ Add single item
- ✅ Correct total calculation
- ✅ Required response fields
- ✅ Validation: missing owner
- ✅ Validation: quantity limit (max 20)
- ✅ Deduplication: combining same items
- ✅ New items added to existing cart

### Cart Get API Tests
- ✅ Non-existent cart returns null
- ✅ Cart after adding item
- ✅ Required cart fields
- ✅ Correct cart totals
- ✅ Multiple items tracking
- ✅ Validation: missing owner
- ✅ Clear cart functionality
- ✅ Separate carts per guest

## Running Custom Tests

Run tests with specific port or mode:

```bash
# Run on custom port
TEST_PORT=3005 vitest run

# Run only menu tests
vitest run api.test.ts -t "Menu API"

# Run only cart tests
vitest run api.test.ts -t "Cart"

# Run specific test
vitest run api.test.ts -t "should return menu items"
```

## Test Output Example

```
 ✓ Menu API (/api/menu)
   ✓ should return menu items
   ✓ should return menu items with required fields
   ✓ should have items with valid pricing
   ✓ should return consistent menu items
   ✓ should have categories

 ✓ Cart Add API (/api/cart/add)
   ✓ should add item to cart
   ✓ should calculate correct total amount
   ✓ should return item with required fields
   ✓ should reject missing guestId and userId
   ✓ should reject quantity exceeding limit
   ✓ should deduplicate items on add with same variant

 ✓ Cart Get API (/api/cart)
   ✓ should return null for non-existent cart
   ✓ should return cart after adding item
   ✓ should have cart with required fields
   ✓ should calculate correct cart totals
   ✓ should track multiple items in cart
   ✓ should reject missing guestId and userId
   ✓ should clear cart successfully
   ✓ should maintain separate carts for different guests

✓ 24 tests passed (2.5s)
```

## How Tests Work

### Test Execution Flow

1. **Setup** (`setup.ts`):
   - Logs current mode (static or prisma)
   - Waits for server to be ready (retries 10x with 1s delay)
   - Times out if server doesn't respond

2. **Helpers** (`helpers.ts`):
   - `apiCall()` - Generic HTTP request wrapper
   - `getMenu()` - GET /api/menu
   - `addToCart()` - POST /api/cart/add
   - `getCart()` - GET /api/cart
   - `clearCart()` - DELETE /api/cart
   - `generateGuestId()` - Creates unique test guest IDs

3. **Tests** (`api.test.ts`):
   - Each test gets a fresh `guestId` (no cross-test contamination)
   - Tests fetch current menu to ensure using real data
   - Both positive and negative cases covered

### Mode Detection

Mode is determined by environment variable:
```bash
CATALOG_READ_SOURCE=static  # In-memory cart, seeded catalog
CATALOG_READ_SOURCE=prisma  # Database cart, DB catalog
```

## Troubleshooting

### Tests Timeout

**Problem:** "Server not ready after 10 retries"

**Solution:**
```bash
# Check server is running on the port
lsof -i :3001

# If not, start manually:
CATALOG_READ_SOURCE=static npm run dev -- --port 3001
```

### Port Already in Use

**Problem:** "EADDRINUSE: address already in use :::3001"

**Solution:**
```bash
# Kill process using the port
lsof -i :3001 | grep LISTEN | awk '{print $2}' | xargs kill -9
```

### Prisma Tests Fail

**Problem:** "Can't reach database server"

**Solution:**
```bash
# Check PostgreSQL is running
psql -h 127.0.0.1 -U postgres -d charme_local -c "SELECT 1;"

# Start if using Docker
docker start charme-postgres
```

### Wrong Mode Detected

**Problem:** Tests say "Running in PRISMA mode" but you wanted static

**Solution:**
```bash
# Make sure to set env var BEFORE the command
CATALOG_READ_SOURCE=static npm run test:static

# NOT: npm run test:static CATALOG_READ_SOURCE=static  (wrong!)
```

## Adding More Tests

To add new tests, create a new `.test.ts` file in `tests/`:

```typescript
import { describe, it, expect } from 'vitest';
import { getMenu, addToCart, generateGuestId } from './helpers';

describe('New Feature', () => {
  it('should do something', async () => {
    const guestId = generateGuestId();
    const { status, data } = await addToCart({
      guestId,
      menuItemId: 'item-id',
      productVariantId: 'default',
      quantity: 1,
    });

    expect(status).toBe(201);
    expect(data.item).toBeDefined();
  });
});
```

## CI/CD Integration

Run in your CI pipeline:

```bash
# Check both modes in CI
npm run test:all

# Or just static mode (faster, no DB setup)
npm run test:static
```

## Performance

Typical test execution times:
- **Static mode**: 15-20 seconds (including server startup)
- **Prisma mode**: 20-30 seconds (includes DB operations)
- **Total**: ~50 seconds

Tests are intentionally kept lightweight - use only what's needed to verify the APIs work end-to-end.
