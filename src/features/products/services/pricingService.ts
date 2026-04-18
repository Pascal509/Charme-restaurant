import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { Money } from "@/lib/money";
import { convertFromBase } from "@/lib/fx/fxService";
import { env } from "@/lib/env";

export async function resolveProductVariantPrice(params: {
  productVariantId: string;
  currency: string;
  fxSpreadBpsOverride?: number;
  tx?: Prisma.TransactionClient;
}) {
  const client = params.tx ?? prisma;
  const currency = params.currency.toUpperCase();

  const localized = await client.productPrice.findUnique({
    where: {
      productVariantId_currency: {
        productVariantId: params.productVariantId,
        currency
      }
    }
  });

  if (localized) {
    return new Money(localized.amountMinor, localized.currency);
  }

  const variant = await client.productVariant.findUnique({
    where: { id: params.productVariantId }
  });

  if (!variant) {
    throw new Error("Product variant not found");
  }

  const baseMoney = new Money(variant.baseAmountMinor, variant.baseCurrency);

  if (baseMoney.currency !== env.BASE_CURRENCY.toUpperCase()) {
    throw new Error("Base currency mismatch for product variant");
  }

  if (baseMoney.currency === currency) {
    return baseMoney;
  }

  const converted = await convertFromBase(
    baseMoney,
    currency,
    params.fxSpreadBpsOverride
  );
  return converted.money;
}

export async function resolveMenuItemPrice(params: {
  menuItemId: string;
  currency: string;
  fxSpreadBpsOverride?: number;
  countryCode?: string;
  tx?: Prisma.TransactionClient;
}) {
  const client = params.tx ?? prisma;
  const currency = params.currency.toUpperCase();

  if (params.countryCode) {
    const override = await client.menuItemPrice.findUnique({
      where: {
        menuItemId_countryCode_currency: {
          menuItemId: params.menuItemId,
          countryCode: params.countryCode.toLowerCase(),
          currency
        }
      }
    });

    if (override) {
      return new Money(override.amountMinor, override.currency);
    }
  }

  const menuItem = await client.menuItem.findUnique({
    where: { id: params.menuItemId }
  });

  if (!menuItem) {
    throw new Error("Menu item not found");
  }

  const baseMoney = new Money(menuItem.baseAmountMinor, menuItem.baseCurrency);

  if (baseMoney.currency !== env.BASE_CURRENCY.toUpperCase()) {
    throw new Error("Base currency mismatch for menu item");
  }

  if (baseMoney.currency === currency) {
    return baseMoney;
  }

  const converted = await convertFromBase(
    baseMoney,
    currency,
    params.fxSpreadBpsOverride
  );
  return converted.money;
}
