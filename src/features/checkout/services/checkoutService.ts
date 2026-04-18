import { prisma } from "@/lib/db";
import { assertStockAvailable, reserveProductStock } from "@/features/products/services/inventoryService";
import { createPaymentSession } from "@/features/payment/services/paymentService";
import { Money } from "@/lib/money";
import { convertToBase } from "@/lib/fx/fxService";
import { resolveMenuItemPrice, resolveProductVariantPrice } from "@/features/products/services/pricingService";
import { Prisma } from "@prisma/client";
import { resolveCountryConfig } from "@/lib/country/countryResolver";
import { selectPaymentProvider } from "@/features/payment/services/paymentRoutingService";
import { createPaymentSessionWithFallback } from "@/features/payment/services/paymentOrchestrator";
import { calculateTax } from "@/features/checkout/services/taxService";
import { isMenuItemAvailable } from "@/features/menu/services/menuService";
import { getPrimaryRestaurant } from "@/features/restaurant/services/restaurantService";
import { assertRestaurantOpen } from "@/features/restaurant/services/hoursService";
import { validateMinimumOrder } from "@/features/restaurant/services/deliveryService";
import { calculateDeliveryFeeForAddress, validateAddressWithinDeliveryZone } from "@/features/addresses/services/deliveryEligibilityService";
import { listPickupSlots } from "@/features/restaurant/services/pickupService";
import { previewLoyaltyRedemption, applyLoyaltyRedemption } from "@/features/loyalty/services/loyaltyService";

const IDEMPOTENCY_TTL_MINUTES = 10;

type CheckoutValidationResult = {
  cart: {
    id: string;
    currency: string;
    items: Array<{
      id: string;
      quantity: number;
      unitAmountMinor: number;
      currency: string;
      productVariantId: string | null;
      menuItemId: string | null;
    }>;
  };
  countryConfig: Awaited<ReturnType<typeof resolveCountryConfig>>;
  restaurant: Awaited<ReturnType<typeof getPrimaryRestaurant>>;
  displayCurrency: string;
  subtotal: Money;
  taxBreakdown: ReturnType<typeof calculateTax>;
  deliveryFee: Money;
  deliveryZoneId: string | null;
  pickupSlotId: string | null;
  total: Money;
  loyalty: {
    pointsToRedeem: number;
    discountMinor: number;
    rewardId?: string | null;
  } | null;
};

export async function validateCartForCheckout(params: {
  cartId: string;
  userId?: string;
  orderType: "DELIVERY" | "PICKUP";
  paymentProvider?: "STRIPE" | "FLUTTERWAVE";
  userCountry?: string;
  billingCountry?: string;
  ipCountry?: string;
  addressId?: string;
  pickupSlotId?: string;
  loyaltyPointsToRedeem?: number | null;
  rewardId?: string | null;
}) {
  return prisma.$transaction(async (tx) =>
    validateCartForCheckoutWithClient(tx, params)
  );
}

async function validateCartForCheckoutWithClient(
  tx: Prisma.TransactionClient,
  params: {
    cartId: string;
    userId?: string;
    orderType: "DELIVERY" | "PICKUP";
    paymentProvider?: "STRIPE" | "FLUTTERWAVE";
    userCountry?: string;
    billingCountry?: string;
    ipCountry?: string;
    addressId?: string;
    pickupSlotId?: string;
    loyaltyPointsToRedeem?: number | null;
    rewardId?: string | null;
  }
): Promise<CheckoutValidationResult> {
  const cart = await tx.cart.findUnique({
    where: { id: params.cartId },
    include: { items: { include: { productVariant: true, menuItem: true } } }
  });

  if (!cart || cart.items.length === 0) {
    throw new Error("Cart is empty");
  }

  const countryConfig = await resolveCountryConfig({
    userCountry: params.userCountry,
    billingCountry: params.billingCountry,
    ipCountry: params.ipCountry,
    preferredCurrency: cart.currency,
    preferredProvider: params.paymentProvider
  });

  const restaurant = await getPrimaryRestaurant();
  if (!restaurant) {
    throw new Error("Restaurant not configured");
  }

  assertRestaurantOpen({
    restaurant,
    operatingHours: restaurant.operatingHours,
    holidayHours: restaurant.holidayHours
  });

  const displayCurrency = countryConfig.currency;
  if (cart.currency !== displayCurrency) {
    await tx.cart.update({
      where: { id: cart.id },
      data: { currency: displayCurrency }
    });
  }

  let subtotal = new Money(0, displayCurrency);

  for (const item of cart.items) {
    if (item.productVariant && !item.productVariant.isActive) {
      throw new Error("Product unavailable");
    }
    if (item.menuItem && !item.menuItem.isAvailable) {
      throw new Error("Menu item unavailable");
    }

    if (item.productVariantId) {
      await assertStockAvailable({
        productVariantId: item.productVariantId,
        quantity: item.quantity,
        tx
      });
    }

    if (item.menuItemId) {
      const availableNow = await isMenuItemAvailable({
        menuItemId: item.menuItemId
      });
      if (!availableNow) {
        throw new Error("Menu item unavailable");
      }
    }

    const currentPrice = item.productVariantId
      ? await resolveProductVariantPrice({
          productVariantId: item.productVariantId,
          currency: displayCurrency,
          fxSpreadBpsOverride: countryConfig.fxSpreadBpsOverride ?? undefined,
          tx
        })
      : item.menuItemId
      ? await resolveMenuItemPrice({
          menuItemId: item.menuItemId,
          currency: displayCurrency,
          fxSpreadBpsOverride: countryConfig.fxSpreadBpsOverride ?? undefined,
          countryCode: countryConfig.countryCode,
          tx
        })
      : null;

    if (!currentPrice) {
      throw new Error("Item pricing missing");
    }

    if (item.unitAmountMinor !== currentPrice.amountMinor || item.currency !== displayCurrency) {
      await tx.cartItem.update({
        where: { id: item.id },
        data: { unitAmountMinor: currentPrice.amountMinor, currency: displayCurrency }
      });
    }

    subtotal = subtotal.add(currentPrice.multiply(item.quantity));
  }

  const taxBreakdown = calculateTax({
    subtotal,
    taxModel: countryConfig.taxModel,
    taxInclusive: countryConfig.taxInclusive,
    taxRateBps: countryConfig.taxRateBps
  });

  let deliveryFee = new Money(0, displayCurrency);
  let deliveryZoneId: string | null = null;
  let pickupSlotId: string | null = null;

  if (params.orderType === "DELIVERY") {
    if (!params.addressId || !params.userId) {
      throw new Error("Delivery address required");
    }

    const { zone } = await validateAddressWithinDeliveryZone({
      restaurantId: restaurant.id,
      addressId: params.addressId,
      userId: params.userId
    });

    deliveryZoneId = zone.id;
    await validateMinimumOrder({
      zone: {
        minimumOrderAmountMinor: zone.minimumOrderAmountMinor,
        currency: zone.currency
      },
      subtotal
    });

    const feeResult = await calculateDeliveryFeeForAddress({
      restaurantId: restaurant.id,
      addressId: params.addressId,
      userId: params.userId,
      displayCurrency
    });

    deliveryFee = feeResult.fee;
  } else if (params.pickupSlotId) {
    const slot = await tx.pickupSlot.findUnique({
      where: { id: params.pickupSlotId }
    });

    if (!slot || slot.restaurantId !== restaurant.id) {
      throw new Error("Pickup slot not available");
    }

    pickupSlotId = slot.id;
  }

  let total = new Money(
    taxBreakdown.totalAmountMinor + deliveryFee.amountMinor,
    displayCurrency
  );

  let loyalty: CheckoutValidationResult["loyalty"] = null;

  if (params.userId && (params.loyaltyPointsToRedeem || params.rewardId)) {
    const preview = await previewLoyaltyRedemption({
      userId: params.userId,
      pointsToRedeem: params.loyaltyPointsToRedeem ?? undefined,
      rewardId: params.rewardId ?? undefined,
      orderSubtotalMinor: subtotal.amountMinor,
      orderTotalMinor: total.amountMinor,
      currency: displayCurrency,
      cartItems: cart.items.map((item) => ({
        menuItemId: item.menuItemId,
        unitAmountMinor: item.unitAmountMinor,
        quantity: item.quantity
      })),
      tx
    });

    const discountMinor = preview.discountMinor ?? 0;
    const pointsToRedeem =
      "pointsToRedeem" in preview
        ? preview.pointsToRedeem
        : preview.reward?.costPoints ?? 0;

    loyalty = {
      pointsToRedeem,
      discountMinor,
      rewardId: params.rewardId ?? undefined
    };

    if (discountMinor > 0) {
      total = total.subtract(new Money(discountMinor, displayCurrency));
    }
  }

  return {
    cart,
    countryConfig,
    restaurant,
    displayCurrency,
    subtotal,
    taxBreakdown,
    deliveryFee,
    deliveryZoneId,
    pickupSlotId,
    total,
    loyalty
  };
}

export async function createOrderFromCart(params: {
  cartId: string;
  userId?: string;
  orderType: "DELIVERY" | "PICKUP";
  idempotencyKey: string;
  paymentProvider?: "STRIPE" | "FLUTTERWAVE";
  userCountry?: string;
  billingCountry?: string;
  ipCountry?: string;
  addressId?: string;
  pickupSlotId?: string;
  loyaltyPointsToRedeem?: number | null;
  rewardId?: string | null;
}) {
  const { cartId, userId, orderType, idempotencyKey } = params;

  const result = await prisma.$transaction(async (tx) => {
    const existingKey = await tx.idempotencyKey.findUnique({
      where: { key_scope: { key: idempotencyKey, scope: "checkout" } }
    });

    if (existingKey?.orderId) {
      const order = await tx.order.findUnique({
        where: { id: existingKey.orderId },
        include: { payments: true }
      });
      if (!order) {
        throw new Error("Idempotency key refers to missing order");
      }
      const payment = order.payments[0] ?? null;
      const countryConfig = await resolveCountryConfig({
        userCountry: order.countryCode,
        preferredCurrency: order.displayCurrency
      });
      const pickupSlots = order.orderType === "PICKUP" && order.restaurantId
        ? await listPickupSlots({ restaurantId: order.restaurantId, date: new Date() })
        : [];

      return {
        order,
        paymentSession: payment,
        providerSession: null,
        provider: payment?.provider ?? null,
        countryConfig,
        pickupSlots
      };
    }

    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + IDEMPOTENCY_TTL_MINUTES);

    const idempotencyRecord = await tx.idempotencyKey.create({
      data: {
        key: idempotencyKey,
        scope: "checkout",
        userId,
        expiresAt
      }
    });
    const validation = await validateCartForCheckoutWithClient(tx, {
      cartId,
      userId,
      orderType,
      paymentProvider: params.paymentProvider,
      userCountry: params.userCountry,
      billingCountry: params.billingCountry,
      ipCountry: params.ipCountry,
      addressId: params.addressId,
      pickupSlotId: params.pickupSlotId,
      loyaltyPointsToRedeem: params.loyaltyPointsToRedeem,
      rewardId: params.rewardId
    });

    const {
      cart,
      countryConfig,
      restaurant,
      displayCurrency,
      subtotal,
      taxBreakdown,
      deliveryFee,
      deliveryZoneId,
      pickupSlotId,
      total,
      loyalty
    } = validation;
    const baseTotalMinor = taxBreakdown.totalAmountMinor + deliveryFee.amountMinor;
    const settlement = await convertToBase(total, countryConfig.fxSpreadBpsOverride ?? undefined);
    const settlementCurrency = settlement.money.currency;
    const fxRateUsed = displayCurrency === settlementCurrency ? null : settlement.rate;

    const provider = await selectPaymentProvider({
      allowedProviders: countryConfig.allowedProviders,
      settlementCurrency,
      preferredProvider: countryConfig.preferredProvider,
      weights: countryConfig.paymentProviderWeights,
      countryCode: countryConfig.countryCode
    });

    const order = await tx.order.create({
      data: {
        userId,
        restaurantId: restaurant.id,
        countryCode: countryConfig.countryCode,
        displayCurrency,
        settlementCurrency,
        fxRateUsed: fxRateUsed ? new Prisma.Decimal(fxRateUsed) : null,
        orderType,
        serviceMode: orderType === "DELIVERY" ? "DELIVERY" : "PICKUP",
        status: "PENDING",
        paymentStatus: "PENDING",
        taxAmountMinor: taxBreakdown.taxAmountMinor,
        deliveryFeeAmountMinor: deliveryFee.amountMinor,
        deliveryZoneId,
        pickupSlotId,
        taxBreakdown: taxBreakdown,
        subtotalAmountMinor: subtotal.amountMinor,
        totalAmountMinor: total.amountMinor,
        loyaltyPointsRedeemed: loyalty?.pointsToRedeem ?? 0,
        loyaltyDiscountMinor: loyalty?.discountMinor ?? 0,
        items: {
          create: cart.items.map((item) => ({
            quantity: item.quantity,
            unitAmountMinor: item.unitAmountMinor,
            currency: displayCurrency,
            productVariantId: item.productVariantId,
            menuItemId: item.menuItemId
          }))
        }
      }
    });

    if (userId && (params.loyaltyPointsToRedeem || params.rewardId)) {
      const applied = await applyLoyaltyRedemption({
        userId,
        orderId: order.id,
        pointsToRedeem: params.loyaltyPointsToRedeem ?? undefined,
        rewardId: params.rewardId ?? undefined,
        orderSubtotalMinor: subtotal.amountMinor,
        orderTotalMinor: total.amountMinor,
        currency: displayCurrency,
        cartItems: cart.items.map((item) => ({
          menuItemId: item.menuItemId,
          unitAmountMinor: item.unitAmountMinor,
          quantity: item.quantity
        })),
        idempotencyKey: `${idempotencyKey}:loyalty`,
        tx
      });

      await tx.order.update({
        where: { id: order.id },
        data: {
          loyaltyPointsRedeemed: applied.pointsRedeemed,
          loyaltyDiscountMinor: applied.discountMinor,
          totalAmountMinor: Math.max(baseTotalMinor - applied.discountMinor, 0)
        }
      });
    }

    await tx.cart.update({
      where: { id: cart.id },
      data: { status: "CHECKED_OUT" }
    });

    let reservationExpiry: Date | null = null;

    for (const item of cart.items) {
      if (item.productVariantId) {
        const reservation = await reserveProductStock({
          productVariantId: item.productVariantId,
          quantity: item.quantity,
          orderId: order.id,
          tx
        });
        if (!reservationExpiry || reservation.reservedUntil > reservationExpiry) {
          reservationExpiry = reservation.reservedUntil;
        }
      }
    }

    if (reservationExpiry) {
      await tx.order.update({
        where: { id: order.id },
        data: { reservationExpiresAt: reservationExpiry }
      });
    }

    const paymentSession = await createPaymentSession({
      orderId: order.id,
      amountMinor: settlement.money.amountMinor,
      currency: settlement.money.currency,
      idempotencyKeyId: idempotencyRecord.id,
      provider,
      tx
    });

    await tx.idempotencyKey.update({
      where: { id: idempotencyRecord.id },
      data: { status: "COMPLETED", orderId: order.id }
    });

    const pickupSlots = orderType === "PICKUP"
      ? await listPickupSlots({ restaurantId: restaurant.id, date: new Date() })
      : [];

    return {
      order,
      paymentSession,
      providerSession: null,
      provider,
      countryConfig,
      pickupSlots
    };
  });

  if (!result.providerSession) {
    const providerSession = await createPaymentSessionWithFallback({
      orderId: result.order.id,
      countryCode: result.countryConfig.countryCode,
      settlementCurrency: result.order.settlementCurrency,
      allowedProviders: result.countryConfig.allowedProviders,
      preferredProvider: result.countryConfig.preferredProvider,
      weights: result.countryConfig.paymentProviderWeights
    });

    return { ...result, providerSession: providerSession.session, provider: providerSession.provider };
  }

  return result;
}
