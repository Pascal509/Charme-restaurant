import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { loyaltyRedeemSchema } from "@/lib/validation/payloads";
import { getActiveCart } from "@/features/cart/services/cartService";
import { validateCartForCheckout } from "@/features/checkout/services/checkoutService";

export async function POST(request: Request) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  if (!token?.sub) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const payload = loyaltyRedeemSchema.parse(body);

    let cartId = payload.cartId ?? null;
    if (!cartId) {
      const cart = await getActiveCart({
        userId: payload.userId ?? String(token.sub),
        guestId: payload.guestId
      });
      if (!cart) throw new Error("Cart not found");
      cartId = cart.id;
    }

    const validation = await validateCartForCheckout({
      cartId,
      userId: String(token.sub),
      orderType: payload.fulfillmentType,
      paymentProvider: payload.paymentProvider,
      userCountry: payload.userCountry,
      billingCountry: payload.billingCountry,
      ipCountry: payload.ipCountry,
      addressId: payload.addressId,
      pickupSlotId: payload.pickupSlotId,
      loyaltyPointsToRedeem: payload.loyaltyPointsToRedeem,
      rewardId: payload.rewardId
    });

    return NextResponse.json({
      valid: true,
      loyalty: validation.loyalty,
      totals: {
        currency: validation.displayCurrency,
        subtotalAmountMinor: validation.subtotal.amountMinor,
        taxAmountMinor: validation.taxBreakdown.taxAmountMinor,
        deliveryAmountMinor: validation.deliveryFee.amountMinor,
        loyaltyDiscountMinor: validation.loyalty?.discountMinor ?? 0,
        loyaltyPointsRedeemed: validation.loyalty?.pointsToRedeem ?? 0,
        totalAmountMinor: validation.total.amountMinor
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to redeem points" },
      { status: 400 }
    );
  }
}
