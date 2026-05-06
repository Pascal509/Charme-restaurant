import type { CartItemInput } from "@/features/cart/types";
import { Money } from "@/lib/money";
import { env } from "@/lib/env";
import { getCatalogService } from "@/lib/catalog";

// In-memory storage for carts (key: cartId, value: cart)
const carts = new Map<string, {
  id: string;
  userId?: string;
  guestId?: string;
  status: "ACTIVE" | "ABANDONED";
  currency: string;
  subtotalAmountMinor: number;
  totalAmountMinor: number;
  createdAt: Date;
  updatedAt: Date;
  items: Array<{
    id: string;
    cartId: string;
    quantity: number;
    unitAmountMinor: number;
    totalAmountMinor: number;
    currency: string;
    selectedOptions?: { optionIds: string[] } | null;
    productVariantId?: string | null;
    menuItemId?: string | null;
    createdAt: Date;
    updatedAt: Date;
  }>;
}>();

// Map to track guestId -> cartId for quick lookup
const guestIdToCartId = new Map<string, string>();
const userIdToCartId = new Map<string, string>();

function generateId(): string {
  return `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export async function getOrCreateCart(params: {
  userId?: string;
  guestId?: string;
  currency?: string;
}) {
  const { userId, guestId, currency } = params;

  if (!userId && !guestId) {
    throw new Error("userId or guestId is required");
  }

  const lookupKey = userId || guestId || "";
  const lookupMap = userId ? userIdToCartId : guestIdToCartId;
  const existingCartId = lookupMap.get(lookupKey);

  if (existingCartId) {
    const cart = carts.get(existingCartId);
    if (cart && cart.status === "ACTIVE") {
      return cart;
    }
  }

  // Create new cart
  const cartId = generateId();
  const newCart = {
    id: cartId,
    userId,
    guestId,
    status: "ACTIVE" as const,
    currency: currency ?? env.BASE_CURRENCY,
    subtotalAmountMinor: 0,
    totalAmountMinor: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    items: []
  };

  carts.set(cartId, newCart);
  lookupMap.set(lookupKey, cartId);

  return newCart;
}

export async function getActiveCart(params: { userId?: string; guestId?: string }) {
  if (!params.userId && !params.guestId) {
    throw new Error("userId or guestId is required");
  }

  const lookupKey = params.userId || params.guestId || "";
  const lookupMap = params.userId ? userIdToCartId : guestIdToCartId;
  const cartId = lookupMap.get(lookupKey);

  if (!cartId) {
    return null;
  }

  return carts.get(cartId) || null;
}

export async function addCartItem(cartId: string, input: CartItemInput) {
  const MAX_ITEM_QTY = 20;

  if (input.quantity > MAX_ITEM_QTY) {
    throw new Error("Quantity exceeds limit");
  }

  const cart = carts.get(cartId);
  if (!cart) throw new Error("Cart not found");
  if (cart.status !== "ACTIVE") throw new Error("Cart not active");

  // Look up pricing from catalog
  let unitPriceMinor = 2800; // fallback price
  if (input.menuItemId) {
    const item = await getCatalogService().findMenuItemBySlug(input.menuItemId);
    if (item) unitPriceMinor = item.priceMinor;
  } else if (input.productVariantId) {
    const product = await getCatalogService().findMarketProductBySkuOrSlug(input.productVariantId);
    if (product) unitPriceMinor = product.variant.amountMinor;
  }

  const unitPrice = new Money(unitPriceMinor, cart.currency);

  const normalizedOptions = normalizeOptions(input.selectedOptions);
  
  // Find existing item with same menuItemId/productVariantId and options
  const existingIndex = cart.items.findIndex(item =>
    item.menuItemId === input.menuItemId &&
    item.productVariantId === input.productVariantId &&
    compareOptions(item.selectedOptions, normalizedOptions)
  );

  if (existingIndex >= 0) {
    const existing = cart.items[existingIndex];
    const newQty = existing.quantity + input.quantity;
    if (newQty > MAX_ITEM_QTY) {
      throw new Error("Quantity exceeds limit");
    }
    existing.quantity = newQty;
    existing.totalAmountMinor = unitPrice.amountMinor * newQty;
    existing.updatedAt = new Date();
  } else {
    const cartItem = {
      id: generateId(),
      cartId,
      quantity: input.quantity,
      unitAmountMinor: unitPrice.amountMinor,
      totalAmountMinor: unitPrice.amountMinor * input.quantity,
      currency: unitPrice.currency,
      selectedOptions: normalizedOptions,
      productVariantId: input.productVariantId,
      menuItemId: input.menuItemId,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    cart.items.push(cartItem);
  }

  // Recalculate totals
  let subtotal = new Money(0, cart.currency);
  for (const item of cart.items) {
    const line = new Money(item.totalAmountMinor, item.currency);
    subtotal = subtotal.add(line);
  }

  cart.subtotalAmountMinor = subtotal.amountMinor;
  cart.totalAmountMinor = subtotal.amountMinor;
  cart.updatedAt = new Date();

  return cart.items[cart.items.length - 1];
}

export async function removeCartItem(cartItemId: string) {
  for (const cart of carts.values()) {
    const index = cart.items.findIndex(item => item.id === cartItemId);
    if (index >= 0) {
      const removed = cart.items[index];
      cart.items.splice(index, 1);

      // Recalculate totals
      let subtotal = new Money(0, cart.currency);
      for (const item of cart.items) {
        const line = new Money(item.totalAmountMinor, item.currency);
        subtotal = subtotal.add(line);
      }

      cart.subtotalAmountMinor = subtotal.amountMinor;
      cart.totalAmountMinor = subtotal.amountMinor;
      cart.updatedAt = new Date();

      return removed;
    }
  }

  throw new Error("Cart item not found");
}

export async function clearCart(cartId: string) {
  const cart = carts.get(cartId);
  if (!cart) throw new Error("Cart not found");
  if (cart.status !== "ACTIVE") throw new Error("Cart not active");

  // Delete cart completely
  carts.delete(cartId);
  
  // Clean up mappings
  if (cart.guestId) guestIdToCartId.delete(cart.guestId);
  if (cart.userId) userIdToCartId.delete(cart.userId);

  return { cartId };
}

export async function updateCartItemQuantity(cartItemId: string, quantity: number) {
  const MAX_ITEM_QTY = 20;

  if (quantity < 1 || quantity > MAX_ITEM_QTY) {
    throw new Error("Invalid quantity");
  }

  for (const cart of carts.values()) {
    const item = cart.items.find(i => i.id === cartItemId);
    if (item) {
      if (cart.status !== "ACTIVE") throw new Error("Cart not active");

      item.quantity = quantity;
      item.totalAmountMinor = item.unitAmountMinor * quantity;
      item.updatedAt = new Date();

      // Recalculate totals
      let subtotal = new Money(0, cart.currency);
      for (const cartItem of cart.items) {
        const line = new Money(cartItem.totalAmountMinor, cartItem.currency);
        subtotal = subtotal.add(line);
      }

      cart.subtotalAmountMinor = subtotal.amountMinor;
      cart.totalAmountMinor = subtotal.amountMinor;
      cart.updatedAt = new Date();

      return item;
    }
  }

  throw new Error("Cart item not found");
}

export async function mergeCarts(guestId: string, userId: string) {
  const guestCart = await getActiveCart({ guestId });
  const userCart = await getOrCreateCart({ userId });

  if (!guestCart) return userCart;

  for (const item of guestCart.items) {
    await addCartItem(userCart.id, {
      productVariantId: item.productVariantId ?? undefined,
      menuItemId: item.menuItemId ?? undefined,
      quantity: item.quantity,
      selectedOptions: extractOptionIds(item.selectedOptions)
    });
  }

  // Mark guest cart as abandoned
  guestCart.status = "ABANDONED";

  return userCart;
}

function normalizeOptions(optionIds?: string[]) {
  if (!optionIds || optionIds.length === 0) return undefined;
  const unique = Array.from(new Set(optionIds));
  unique.sort();
  return { optionIds: unique };
}

function compareOptions(existing: unknown, incoming?: { optionIds: string[] }) {
  if (!existing && !incoming) return true;
  if (!existing || !incoming) return false;
  const existingIds = extractOptionIds(existing);
  if (existingIds.length !== incoming.optionIds.length) return false;
  return existingIds.every((id, index) => id === incoming.optionIds[index]);
}

function extractOptionIds(value: unknown) {
  if (!value || typeof value !== "object") return [];
  const optionIds = (value as { optionIds?: unknown }).optionIds;
  if (!Array.isArray(optionIds)) return [];
  return optionIds.filter((id) => typeof id === "string") as string[];
}
