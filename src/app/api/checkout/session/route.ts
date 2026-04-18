import { NextResponse } from "next/server";
import { checkoutSessionSchema } from "@/lib/validation/payloads";
import { getActiveCart } from "@/features/cart/services/cartService";
import { createOrderFromCart } from "@/features/checkout/services/checkoutService";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const payload = checkoutSessionSchema.parse(body);

    let cartId = payload.cartId ?? null;
    if (!cartId) {
      const cart = await getActiveCart({ guestId: payload.guestId });
      if (!cart) {
        throw new Error("Cart not found");
      }
      cartId = cart.id;
    }

    const result = await createOrderFromCart({
      cartId,
      userId: payload.userId,
      orderType: payload.fulfillmentType,
      idempotencyKey: payload.idempotencyKey,
      paymentProvider: payload.paymentProvider,
      addressId: payload.addressId,
      pickupSlotId: payload.pickupSlotId,
      userCountry: payload.userCountry,
      billingCountry: payload.billingCountry,
      ipCountry: payload.ipCountry,
      loyaltyPointsToRedeem: payload.loyaltyPointsToRedeem,
      rewardId: payload.rewardId
    });

    return NextResponse.json({
      checkoutUrl: result.providerSession?.redirectUrl ?? null,
      orderId: result.order.id
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create checkout session" },
      { status: 400 }
    );
  }
}
