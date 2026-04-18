import { NextResponse } from "next/server";
import { cartValidationSchema } from "@/lib/validation/payloads";
import { getActiveCart } from "@/features/cart/services/cartService";
import { validateCartForCheckout } from "@/features/checkout/services/checkoutService";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const payload = cartValidationSchema.parse(body);

    let cartId = payload.cartId ?? null;
    if (!cartId) {
      const cart = await getActiveCart({
        userId: payload.userId,
        guestId: payload.guestId
      });

      if (!cart) {
        return NextResponse.json({ valid: false, errors: ["Cart not found"], totals: null });
      }

      cartId = cart.id;
    }

    try {
      const validation = await validateCartForCheckout({
        cartId,
        userId: payload.userId,
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
        errors: [],
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
      return NextResponse.json({
        valid: false,
        errors: [error instanceof Error ? error.message : "Cart validation failed"],
        totals: null
      });
    }
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to validate cart" },
      { status: 400 }
    );
  }
}
