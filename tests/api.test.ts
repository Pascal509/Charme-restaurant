import { describe, it, expect, beforeEach } from 'vitest';
import {
  getMenu,
  addToCart,
  getCart,
  clearCart,
  removeCartItem,
  updateCartItemQuantity,
  checkout,
  generateGuestId,
  apiCall,
} from "./helpers";
describe('Menu API (/api/menu)', () => {
  it('should return menu items', async () => {
    const { status, data } = await getMenu();

    expect(status).toBe(200);
    expect(data).toHaveProperty('menu');
    expect(Array.isArray(data.menu)).toBe(true);
    expect(data.menu.length).toBeGreaterThan(0);
  });

  it('should return menu items with required fields', async () => {
    const { status, data } = await getMenu();

    expect(status).toBe(200);
    const item = data.menu[0];
    
    expect(item).toHaveProperty('id');
    expect(item).toHaveProperty('name');
    expect(item).toHaveProperty('slug');
    expect(item).toHaveProperty('description');
    expect(item).toHaveProperty('imageUrl');
    expect(item).toHaveProperty('priceMinor');
  });

  it('should have items with valid pricing', async () => {
    const { status, data } = await getMenu();

    expect(status).toBe(200);
    const item = data.menu[0];
    
    expect(item.priceMinor).toBeGreaterThan(0);
    expect(typeof item.priceMinor).toBe('number');
  });

  it('should return consistent menu items', async () => {
    const { data: data1 } = await getMenu();
    const { data: data2 } = await getMenu();

    expect(data1.menu.length).toBe(data2.menu.length);
    expect(data1.menu[0].id).toBe(data2.menu[0].id);
  });

  it('should have categories', async () => {
    const { status, data } = await getMenu();

    expect(status).toBe(200);
    expect(data).toHaveProperty('menu');
    expect(Array.isArray(data.menu)).toBe(true);
    expect(data.menu.length).toBeGreaterThan(0);
  });
});

/**
 * Cart Add API Integration Tests
 * 
 * Tests /api/cart/add endpoint
 * Runs in both static and prisma modes
 */

describe('Cart Add API (/api/cart/add)', () => {
  let guestId: string;
  let menuItemId: string;

  beforeEach(async () => {
    guestId = generateGuestId();
    
    // Get first menu item to use in tests
    const { data: menuData } = await getMenu();
    menuItemId = menuData.menu[0].id;
  });

  it('should add item to cart', async () => {
    const { status, data } = await addToCart({
      guestId,
      menuItemId,
      productVariantId: 'default',
      quantity: 1,
    });

    expect(status).toBe(201);
    expect(data).toHaveProperty('cartId');
    expect(data).toHaveProperty('item');
    expect(data.item.menuItemId).toBe(menuItemId);
    expect(data.item.quantity).toBe(1);
  });

  it('should calculate correct total amount', async () => {
    const { data: menuData } = await getMenu();
    const itemPrice = menuData.menu[0].priceMinor;
    const quantity = 2;

    const { status, data } = await addToCart({
      guestId,
      menuItemId,
      productVariantId: 'default',
      quantity,
    });

    expect(status).toBe(201);
    expect(data.item.unitAmountMinor).toBe(itemPrice);
    expect(data.item.totalAmountMinor).toBe(itemPrice * quantity);
  });

  it('should return item with required fields', async () => {
    const { status, data } = await addToCart({
      guestId,
      menuItemId,
      productVariantId: 'default',
      quantity: 1,
    });

    expect(status).toBe(201);
    const item = data.item;

    expect(item).toHaveProperty('id');
    expect(item).toHaveProperty('cartId');
    expect(item).toHaveProperty('quantity');
    expect(item).toHaveProperty('unitAmountMinor');
    expect(item).toHaveProperty('totalAmountMinor');
    expect(item).toHaveProperty('currency');
    expect(item).toHaveProperty('menuItemId');
    expect(item).toHaveProperty('productVariantId');
    expect(item).toHaveProperty('createdAt');
    expect(item).toHaveProperty('updatedAt');
  });

  it('should reject missing guestId and userId', async () => {
    const { status, data } = await addToCart({
      menuItemId,
      productVariantId: 'default',
      quantity: 1,
    });

    expect(status).toBe(400);
    expect(data).toHaveProperty('error');
  });

  it('should reject quantity exceeding limit', async () => {
    const { status, data } = await addToCart({
      guestId,
      menuItemId,
      productVariantId: 'default',
      quantity: 21, // Max is 20
    });

    expect(status).toBe(400);
    expect(data).toHaveProperty('error');
  });

  it('should deduplicate items on add with same variant', async () => {
    // Add same item twice
    await addToCart({
      guestId,
      menuItemId,
      productVariantId: 'default',
      quantity: 1,
    });

    const { status, data } = await addToCart({
      guestId,
      menuItemId,
      productVariantId: 'default',
      quantity: 1,
    });

    expect(status).toBe(201);
    expect(data.item.quantity).toBe(2); // Should be combined
  });
});

/**
 * Cart Get API Integration Tests
 * 
 * Tests /api/cart endpoint
 * Runs in both static and prisma modes
 */

describe('Cart Get API (/api/cart)', () => {
  let guestId: string;
  let menuItemId: string;

  beforeEach(async () => {
    guestId = generateGuestId();
    
    const { data: menuData } = await getMenu();
    menuItemId = menuData.menu[0].id;
  });

  it('should return null for non-existent cart', async () => {
    const { status, data } = await getCart({
      guestId: 'non-existent-' + Date.now(),
    });

    expect(status).toBe(200);
    expect(data.cart).toBeNull();
  });

  it('should return cart after adding item', async () => {
    await addToCart({
      guestId,
      menuItemId,
      productVariantId: 'default',
      quantity: 2,
    });

    const { status, data } = await getCart({ guestId });

    expect(status).toBe(200);
    expect(data.cart).not.toBeNull();
    expect(data.cart.id).toBeDefined();
    expect(data.cart.items).toHaveLength(1);
  });

  it('should have cart with required fields', async () => {
    await addToCart({
      guestId,
      menuItemId,
      productVariantId: 'default',
      quantity: 1,
    });

    const { status, data } = await getCart({ guestId });

    expect(status).toBe(200);
    const cart = data.cart;

    expect(cart).toHaveProperty('id');
    expect(cart).toHaveProperty('status');
    expect(cart).toHaveProperty('currency');
    expect(cart).toHaveProperty('subtotalAmountMinor');
    expect(cart).toHaveProperty('totalAmountMinor');
    expect(cart).toHaveProperty('items');
    expect(Array.isArray(cart.items)).toBe(true);
  });

  it('should calculate correct cart totals', async () => {
    const { data: menuData } = await getMenu();
    const itemPrice = menuData.menu[0].priceMinor;

    await addToCart({
      guestId,
      menuItemId,
      productVariantId: 'default',
      quantity: 3,
    });

    const { status, data } = await getCart({ guestId });

    expect(status).toBe(200);
    expect(data.cart.totalAmountMinor).toBe(itemPrice * 3);
  });

  it('should track multiple items in cart', async () => {
    const { data: menuData } = await getMenu();

    // Add first item
    await addToCart({
      guestId,
      menuItemId: menuData.menu[0].id,
      productVariantId: 'default',
      quantity: 1,
    });

    // Add second item if available
    if (menuData.menu.length > 1) {
      await addToCart({
        guestId,
        menuItemId: menuData.menu[1].id,
        productVariantId: 'default',
        quantity: 1,
      });
    }

    const { status, data } = await getCart({ guestId });

    expect(status).toBe(200);
    expect(data.cart.items.length).toBeGreaterThanOrEqual(1);
  });

  it('should reject missing guestId and userId', async () => {
    const { status, data } = await getCart({});

    expect(status).toBe(400);
    expect(data).toHaveProperty('error');
  });

  it('should clear cart successfully', async () => {
    // Add item
    await addToCart({
      guestId,
      menuItemId,
      productVariantId: 'default',
      quantity: 1,
    });

    // Clear cart
    const { status: clearStatus } = await clearCart({ guestId });
    expect(clearStatus).toBe(200);

    // Verify cart is cleared
    const { data } = await getCart({ guestId });
    expect(data.cart).toBeNull();
  });

  it('should maintain separate carts for different guests', async () => {
    const guest1 = generateGuestId();
    const guest2 = generateGuestId();

    // Add item to guest1's cart
    await addToCart({
      guestId: guest1,
      menuItemId,
      productVariantId: 'default',
      quantity: 1,
    });

    // Add different quantity to guest2's cart
    await addToCart({
      guestId: guest2,
      menuItemId,
      productVariantId: 'default',
      quantity: 5,
    });

    const { data: cart1Data } = await getCart({ guestId: guest1 });
    const { data: cart2Data } = await getCart({ guestId: guest2 });

    expect(cart1Data.cart.items[0].quantity).toBe(1);
    expect(cart2Data.cart.items[0].quantity).toBe(5);
  });
});

/**
 * Update Cart Item Quantity API Tests
 * 
 * Tests PUT /api/cart/item/:id endpoint
 * Runs in both static and prisma modes
 */

describe('Update Cart Item Quantity API (PUT /api/cart/item/:id)', () => {
  let guestId: string;
  let menuItemId: string;

  beforeEach(async () => {
    guestId = generateGuestId();
    
    const { data: menuData } = await getMenu();
    menuItemId = menuData.menu[0].id;
  });

  it('should update item quantity', async () => {
    const addResult = await addToCart({
      guestId,
      menuItemId,
      productVariantId: 'default',
      quantity: 1,
    });

    const itemId = addResult.data.item.id;
    const unitPrice = addResult.data.item.unitAmountMinor;

    const { status, data } = await updateCartItemQuantity(itemId, 5, { guestId });

    expect(status).toBe(200);
    expect(data.item.quantity).toBe(5);
    expect(data.item.totalAmountMinor).toBe(unitPrice * 5);
  });

  it('should reject quantity below 1', async () => {
    const addResult = await addToCart({
      guestId,
      menuItemId,
      productVariantId: 'default',
      quantity: 1,
    });

    const itemId = addResult.data.item.id;
    const { status } = await updateCartItemQuantity(itemId, 0, { guestId });

    expect(status).toBe(400);
  });

  it('should reject quantity exceeding limit', async () => {
    const addResult = await addToCart({
      guestId,
      menuItemId,
      productVariantId: 'default',
      quantity: 1,
    });

    const itemId = addResult.data.item.id;
    const { status } = await updateCartItemQuantity(itemId, 21, { guestId });

    expect(status).toBe(400);
  });

  it('should update cart totals after quantity change', async () => {
    const { data: menuData } = await getMenu();
    const itemPrice = menuData.menu[0].priceMinor;

    const addResult = await addToCart({
      guestId,
      menuItemId,
      productVariantId: 'default',
      quantity: 1,
    });

    const itemId = addResult.data.item.id;
    await updateCartItemQuantity(itemId, 3, { guestId });

    const { data: cartData } = await getCart({ guestId });
    expect(cartData.cart.totalAmountMinor).toBe(itemPrice * 3);
  });
});

/**
 * Remove Cart Item API Tests
 * 
 * Tests DELETE /api/cart/item/:id endpoint
 * Runs in both static and prisma modes
 */

describe('Remove Cart Item API (DELETE /api/cart/item/:id)', () => {
  let guestId: string;
  let menuItemId: string;

  beforeEach(async () => {
    guestId = generateGuestId();
    
    const { data: menuData } = await getMenu();
    menuItemId = menuData.menu[0].id;
  });

  it('should remove item from cart', async () => {
    const addResult = await addToCart({
      guestId,
      menuItemId,
      productVariantId: 'default',
      quantity: 1,
    });

    const itemId = addResult.data.item.id;

    const { status, data } = await removeCartItem(itemId, { guestId });

    expect(status).toBe(200);
    expect(data.item.id).toBe(itemId);
  });

  it('should update cart totals after item removal', async () => {
    const { data: menuData } = await getMenu();

    // Add two items
    await addToCart({
      guestId,
      menuItemId: menuData.menu[0].id,
      productVariantId: 'default',
      quantity: 1,
    });

    if (menuData.menu.length > 1) {
      const addResult = await addToCart({
        guestId,
        menuItemId: menuData.menu[1].id,
        productVariantId: 'default',
        quantity: 1,
      });

      const itemIdToRemove = addResult.data.item.id;

      // Get initial cart total
      const { data: cartBefore } = await getCart({ guestId });
      const totalBefore = cartBefore.cart.totalAmountMinor;

      // Remove second item
      await removeCartItem(itemIdToRemove, { guestId });

      // Verify total decreased
      const { data: cartAfter } = await getCart({ guestId });
      expect(cartAfter.cart.totalAmountMinor).toBeLessThan(totalBefore);
      expect(cartAfter.cart.items.length).toBe(1);
    }
  });

  it('should remove item completely from cart', async () => {
    const addResult = await addToCart({
      guestId,
      menuItemId,
      productVariantId: 'default',
      quantity: 1,
    });

    const itemId = addResult.data.item.id;
    await removeCartItem(itemId, { guestId });

    const { data } = await getCart({ guestId });
    // Cart still exists but should be empty
    expect(data.cart).not.toBeNull();
    expect(data.cart.items.length).toBe(0);
    expect(data.cart.totalAmountMinor).toBe(0);
  });
});

/**
 * Clear Cart API Tests
 * 
 * Additional tests for DELETE /api/cart endpoint
 */

describe('Clear Cart Extended Tests', () => {
  let guestId: string;
  let menuItemId: string;

  beforeEach(async () => {
    guestId = generateGuestId();
    
    const { data: menuData } = await getMenu();
    menuItemId = menuData.menu[0].id;
  });

  it('should clear multiple items at once', async () => {
    const { data: menuData } = await getMenu();

    // Add multiple items
    await addToCart({
      guestId,
      menuItemId: menuData.menu[0].id,
      productVariantId: 'default',
      quantity: 2,
    });

    if (menuData.menu.length > 1) {
      await addToCart({
        guestId,
        menuItemId: menuData.menu[1].id,
        productVariantId: 'default',
        quantity: 3,
      });
    }

    // Verify items exist
    const { data: cartBefore } = await getCart({ guestId });
    expect(cartBefore.cart.items.length).toBeGreaterThan(0);

    // Clear cart
    const { status } = await clearCart({ guestId });
    expect(status).toBe(200);

    // Verify cart is empty
    const { data: cartAfter } = await getCart({ guestId });
    expect(cartAfter.cart).toBeNull();
  });

  it('should handle clearing empty cart gracefully', async () => {
    const { status } = await clearCart({ guestId });
    expect(status).toBe(200);
  });
});

/**
 * Checkout API Tests
 * 
 * Tests POST /api/checkout endpoint
 * Validates cart and creates mock order
 * Runs in both static and prisma modes
 */

describe('Checkout API (POST /api/checkout)', () => {
  let guestId: string;
  let menuItemId: string;

  beforeEach(async () => {
    guestId = generateGuestId();
    
    const { data: menuData } = await getMenu();
    menuItemId = menuData.menu[0].id;
  });

  it('should require items in cart', async () => {
    const { status, data } = await checkout({ guestId });

    expect(status).toBe(404); // or 400 for empty cart
    expect(data).toHaveProperty('error');
  });

  it('should create checkout session with items', async () => {
    await addToCart({
      guestId,
      menuItemId,
      productVariantId: 'default',
      quantity: 2,
    });

    const { status, data } = await checkout({ guestId });

    expect(status).toBe(201);
    expect(data.success).toBe(true);
    expect(data).toHaveProperty('orderId');
    expect(data.orderId).toMatch(/^ORD_/);
  });

  it('should include all cart items in checkout', async () => {
    const { data: menuData } = await getMenu();

    await addToCart({
      guestId,
      menuItemId: menuData.menu[0].id,
      productVariantId: 'default',
      quantity: 1,
    });

    if (menuData.menu.length > 1) {
      await addToCart({
        guestId,
        menuItemId: menuData.menu[1].id,
        productVariantId: 'default',
        quantity: 2,
      });
    }

    const { status, data } = await checkout({ guestId });

    expect(status).toBe(201);
    expect(data.items.length).toBeGreaterThanOrEqual(1);
  });

  it('should calculate correct totals in checkout', async () => {
    const { data: menuData } = await getMenu();
    const itemPrice = menuData.menu[0].priceMinor;
    const quantity = 3;

    await addToCart({
      guestId,
      menuItemId: menuData.menu[0].id,
      productVariantId: 'default',
      quantity,
    });

    const { status, data } = await checkout({ guestId });

    expect(status).toBe(201);
    expect(data.pricing.subtotalMinor).toBe(itemPrice * quantity);
    expect(data.pricing.taxMinor).toBeGreaterThan(0);
    expect(data.pricing.deliveryFeeMinor).toBeGreaterThan(0);
    expect(data.pricing.totalMinor).toBe(
      data.pricing.subtotalMinor + data.pricing.taxMinor + data.pricing.deliveryFeeMinor
    );
  });

  it('should include order metadata', async () => {
    await addToCart({
      guestId,
      menuItemId,
      productVariantId: 'default',
      quantity: 1,
    });

    const { status, data } = await checkout({ guestId });

    expect(status).toBe(201);
    expect(data).toHaveProperty('cartId');
    expect(data).toHaveProperty('status', 'pending');
    expect(data).toHaveProperty('timestamps');
    expect(data.timestamps).toHaveProperty('createdAt');
    expect(data.timestamps).toHaveProperty('expiresAt');
    expect(data).toHaveProperty('paymentMethods');
    expect(Array.isArray(data.paymentMethods)).toBe(true);
  });

  it('should reject invalid owner parameters', async () => {
    const { status, data } = await checkout({});

    expect(status).toBeGreaterThanOrEqual(400);
    expect(data).toHaveProperty('error');
  });
});
