import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import type { CartItemInput } from "@/features/cart/types";
import { Money } from "@/lib/money";
import { resolveMenuItemPrice, resolveProductVariantPrice } from "@/features/products/services/pricingService";
import { isMenuItemAvailable } from "@/features/menu/services/menuService";
import { convertFromBase, convertToBase } from "@/lib/fx/fxService";
import { env } from "@/lib/env";

const MAX_ITEM_QTY = 20;

export async function getOrCreateCart(params: {
  userId?: string;
  guestId?: string;
  currency?: string;
}) {
  const { userId, guestId, currency } = params;

  if (!userId && !guestId) {
    throw new Error("userId or guestId is required");
  }

  return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const existing = userId
      ? await tx.cart.findFirst({ where: { userId, status: "ACTIVE" } })
      : await tx.cart.findFirst({ where: { guestId: guestId ?? undefined, status: "ACTIVE" } });

    if (existing) return existing;

    if (userId) {
      await tx.cart.updateMany({
        where: { userId, status: "ACTIVE" },
        data: { status: "ABANDONED" }
      });
    }

    if (guestId) {
      await tx.cart.updateMany({
        where: { guestId, status: "ACTIVE" },
        data: { status: "ABANDONED" }
      });
    }

    return tx.cart.create({
      data: {
        userId,
        guestId,
        status: "ACTIVE",
        currency: currency ?? env.BASE_CURRENCY,
        subtotalAmountMinor: 0,
        totalAmountMinor: 0
      }
    });
  });
}

export async function getActiveCart(params: { userId?: string; guestId?: string }) {
  if (!params.userId && !params.guestId) {
    throw new Error("userId or guestId is required");
  }

  return prisma.cart.findFirst({
    where: {
      status: "ACTIVE",
      ...(params.userId ? { userId: params.userId } : { guestId: params.guestId })
    },
    include: { items: true }
  });
}

export async function addCartItem(cartId: string, input: CartItemInput) {
  if (input.quantity > MAX_ITEM_QTY) {
    throw new Error("Quantity exceeds limit");
  }

  const normalizedOptions = normalizeOptions(input.selectedOptions);

  return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const cart = await tx.cart.findUnique({ where: { id: cartId } });
    if (!cart) throw new Error("Cart not found");
    if (cart.status !== "ACTIVE") throw new Error("Cart not active");

    const unitPrice = await resolveItemPricing(input, cart.currency);

    if (unitPrice.currency !== cart.currency) {
      throw new Error("Currency mismatch");
    }

    const existingItems = (await tx.cartItem.findMany({
      where: {
        cartId,
        productVariantId: input.productVariantId ?? undefined,
        menuItemId: input.menuItemId ?? undefined
      }
    })) as Array<{ id: string; quantity: number; selectedOptions: unknown }>;

    const existing = existingItems.find((item: { selectedOptions: unknown }) =>
      compareOptions(item.selectedOptions, normalizedOptions)
    );

    if (existing) {
      const newQty = existing.quantity + input.quantity;
      if (newQty > MAX_ITEM_QTY) {
        throw new Error("Quantity exceeds limit");
      }
      await validateAvailability(input, newQty);
      const updated = await tx.cartItem.update({
        where: { id: existing.id },
        data: {
          quantity: newQty,
          unitAmountMinor: unitPrice.amountMinor,
          totalAmountMinor: unitPrice.amountMinor * newQty,
          currency: unitPrice.currency
        }
      });

      await refreshCartTotals(tx, cartId);
      return updated;
    }

    await validateAvailability(input, input.quantity);

    const created = await tx.cartItem.create({
      data: {
        cartId,
        quantity: input.quantity,
        unitAmountMinor: unitPrice.amountMinor,
        totalAmountMinor: unitPrice.amountMinor * input.quantity,
        currency: unitPrice.currency,
        selectedOptions: normalizedOptions,
        productVariantId: input.productVariantId,
        menuItemId: input.menuItemId
      }
    });

    await refreshCartTotals(tx, cartId);
    return created;
  });
}

export async function updateCartItemQuantity(cartItemId: string, quantity: number) {
  if (quantity < 1 || quantity > MAX_ITEM_QTY) {
    throw new Error("Invalid quantity");
  }

  return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const item = await tx.cartItem.findUnique({
      where: { id: cartItemId },
      include: { cart: true, productVariant: true, menuItem: true }
    });
    if (!item) throw new Error("Cart item not found");
    if (item.cart.status !== "ACTIVE") throw new Error("Cart not active");

    await validateAvailability(
      {
        productVariantId: item.productVariantId ?? undefined,
        menuItemId: item.menuItemId ?? undefined,
        quantity,
        selectedOptions: extractOptionIds(item.selectedOptions)
      },
      quantity
    );

    const updated = await tx.cartItem.update({
      where: { id: cartItemId },
      data: { quantity, totalAmountMinor: item.unitAmountMinor * quantity }
    });

    await refreshCartTotals(tx, item.cartId);
    return updated;
  });
}

export async function removeCartItem(cartItemId: string) {
  return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const item = await tx.cartItem.findUnique({ where: { id: cartItemId } });
    if (!item) throw new Error("Cart item not found");
    const removed = await tx.cartItem.delete({ where: { id: cartItemId } });
    await refreshCartTotals(tx, item.cartId);
    return removed;
  });
}

export async function clearCart(cartId: string) {
  return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const cart = await tx.cart.findUnique({ where: { id: cartId } });
    if (!cart) throw new Error("Cart not found");
    if (cart.status !== "ACTIVE") throw new Error("Cart not active");

    await tx.cartItem.deleteMany({ where: { cartId } });
    await tx.cart.update({
      where: { id: cartId },
      data: { subtotalAmountMinor: 0, totalAmountMinor: 0 }
    });

    return { cartId };
  });
}

export async function mergeCarts(guestId: string, userId: string) {
  const guestCart = await prisma.cart.findFirst({
    where: { guestId, status: "ACTIVE" },
    include: { items: true }
  });

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

  await prisma.cart.delete({ where: { id: guestCart.id } });

  return userCart;
}

export async function calculateCartTotals(cartId: string) {
  const items = await prisma.cartItem.findMany({ where: { cartId } });
  let subtotal = new Money(0, items[0]?.currency ?? env.BASE_CURRENCY);

  for (const item of items) {
    const line = new Money(item.totalAmountMinor ?? item.unitAmountMinor * item.quantity, item.currency);
    subtotal = subtotal.add(line);
  }

  return {
    subtotalAmountMinor: subtotal.amountMinor,
    totalAmountMinor: subtotal.amountMinor,
    currency: subtotal.currency
  };
}

async function refreshCartTotals(tx: Prisma.TransactionClient, cartId: string) {
  const totals = await calculateCartTotals(cartId);
  await tx.cart.update({
    where: { id: cartId },
    data: {
      subtotalAmountMinor: totals.subtotalAmountMinor,
      totalAmountMinor: totals.totalAmountMinor,
      currency: totals.currency
    }
  });
}

async function resolveItemPricing(input: CartItemInput, currency: string) {
  if (input.productVariantId) {
    const variant = await prisma.productVariant.findUnique({
      where: { id: input.productVariantId }
    });
    if (!variant || !variant.isActive) throw new Error("Product unavailable");
    return resolveProductVariantPrice({
      productVariantId: input.productVariantId,
      currency
    });
  }

  if (input.menuItemId) {
    const menuItem = await prisma.menuItem.findUnique({
      where: { id: input.menuItemId }
    });
    if (!menuItem || !menuItem.isAvailable) throw new Error("Menu item unavailable");
    const basePrice = await resolveMenuItemPrice({
      menuItemId: input.menuItemId,
      currency
    });

    const modifierAmount = await resolveModifierPrice({
      menuItemId: input.menuItemId,
      optionIds: input.selectedOptions ?? [],
      currency
    });

    return new Money(basePrice.amountMinor + modifierAmount, currency);
  }

  throw new Error("Invalid cart item");
}

async function validateAvailability(input: CartItemInput, quantity: number) {
  if (input.productVariantId) {
    const variant = await prisma.productVariant.findUnique({
      where: { id: input.productVariantId }
    });
    if (!variant || !variant.isActive) throw new Error("Product unavailable");
    const available = variant.stockOnHand - variant.stockReserved;
    if (available < quantity) throw new Error("Insufficient stock");
  }

  if (input.menuItemId) {
    const menuItem = await prisma.menuItem.findUnique({
      where: { id: input.menuItemId }
    });
    if (!menuItem || !menuItem.isAvailable) throw new Error("Menu item unavailable");

    const availableNow = await isMenuItemAvailable({
      menuItemId: input.menuItemId
    });
    if (!availableNow) throw new Error("Menu item unavailable");

    await validateModifierSelection({
      menuItemId: input.menuItemId,
      optionIds: input.selectedOptions ?? []
    });
  }
}

async function validateModifierSelection(params: {
  menuItemId: string;
  optionIds: string[];
}) {
  const menuItem = (await prisma.menuItem.findUnique({
    where: { id: params.menuItemId },
    include: {
      modifierGroups: {
        include: {
          modifierGroup: {
            include: { options: true }
          }
        }
      }
    }
  })) as
    | {
        modifierGroups: Array<{
          minSelectOverride: number | null;
          maxSelectOverride: number | null;
          modifierGroup: {
            minSelect: number;
            maxSelect: number;
            isRequired: boolean;
            options: Array<{ id: string }>;
          };
        }>;
      }
    | null;

  if (!menuItem) return;

  const optionSet = new Set(params.optionIds);

  for (const link of menuItem.modifierGroups) {
    const group = link.modifierGroup;
    const allowedOptions = group.options.map((option: { id: string }) => option.id);
    const selected = allowedOptions.filter((id: string) => optionSet.has(id));

    const minSelect = link.minSelectOverride ?? group.minSelect;
    const maxSelect = link.maxSelectOverride ?? group.maxSelect;
    const required = group.isRequired;

    if (required && selected.length < Math.max(1, minSelect)) {
      throw new Error("Required options missing");
    }

    if (selected.length < minSelect) {
      throw new Error("Minimum options not met");
    }

    if (selected.length > maxSelect) {
      throw new Error("Too many options selected");
    }
  }

  const allAllowed = new Set(
    menuItem.modifierGroups.flatMap((link: { modifierGroup: { options: Array<{ id: string }> } }) =>
      link.modifierGroup.options.map((opt: { id: string }) => opt.id)
    )
  );

  for (const optionId of params.optionIds) {
    if (!allAllowed.has(optionId)) {
      throw new Error("Invalid modifier option");
    }
  }
}

async function resolveModifierPrice(params: {
  menuItemId: string;
  optionIds: string[];
  currency: string;
}) {
  if (params.optionIds.length === 0) return 0;

  const options = (await prisma.modifierOption.findMany({
    where: { id: { in: params.optionIds } },
    include: { prices: true }
  })) as Array<{
    baseAmountMinor: number;
    baseCurrency: string;
    prices: Array<{ currency: string; amountMinor: number }>;
  }>;

  let total = new Money(0, params.currency);

  for (const option of options) {
    const price = option.prices.find((entry: { currency: string }) => entry.currency === params.currency);
    if (price) {
      total = total.add(new Money(price.amountMinor, params.currency));
      continue;
    }

    const baseMoney = new Money(option.baseAmountMinor, option.baseCurrency);
    const converted = await convertMoney(baseMoney, params.currency);
    total = total.add(converted);
  }

  return total.amountMinor;
}

async function convertMoney(money: Money, targetCurrency: string) {
  if (money.currency === targetCurrency) return money;

  const baseMoney = await convertToBase(money);
  if (baseMoney.money.currency === targetCurrency) return baseMoney.money;

  const converted = await convertFromBase(baseMoney.money, targetCurrency);
  return converted.money;
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
