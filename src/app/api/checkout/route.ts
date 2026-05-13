import { NextResponse } from "next/server";
import { z } from "zod";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Mock Checkout Endpoint
 * 
 * Simple checkout that validates the cart and returns a mock order
 * Works in both static and prisma modes
 */

const checkoutRequestSchema = z.object({
  cartId: z.string().optional(),
  userId: z.string().optional(),
  guestId: z.string().optional(),
});


function generateOrderId(): string {
  return `ORD_${Date.now()}_${Math.random().toString(36).substr(2, 8).toUpperCase()}`;
}

export async function POST(request: Request) {
  const { cartService } = await import("@/features/cart/services/cartService");
  const { getAvailablePaymentProviders } = await import("@/features/payment/services/paymentConfig");
  try {
    const body = await request.json();
    const payload = checkoutRequestSchema.parse(body);

    // Get cart
    const cart = await cartService.getActiveCart({
      userId: payload.userId,
      guestId: payload.guestId,
    });

    if (!cart) {
      return NextResponse.json(
        { error: "Cart not found" },
        { status: 404 }
      );
    }

    // Validate cart has items
    if (!cart.items || cart.items.length === 0) {
      return NextResponse.json(
        { error: "Cart is empty. Please add items before checkout." },
        { status: 400 }
      );
    }

    // Validate each item has valid quantity
    for (const item of cart.items) {
      if (item.quantity < 1 || item.quantity > 20) {
        return NextResponse.json(
          { error: `Invalid quantity for item ${item.id}` },
          { status: 400 }
        );
      }
    }

    // Format items for response
    const items = cart.items.map((item) => ({
      id: item.id,
      menuItemId: item.menuItemId,
      quantity: item.quantity,
      unitAmountMinor: item.unitAmountMinor,
      totalAmountMinor: item.totalAmountMinor,
      currency: item.currency,
    }));

    // Calculate fees (mock values)
    const subtotalMinor = cart.subtotalAmountMinor;
    const deliveryFeeMinor = 50000; // ₦500
    const taxPercentage = 0.075; // 7.5%
    const taxMinor = Math.round(subtotalMinor * taxPercentage);
    const totalMinor = subtotalMinor + taxMinor + deliveryFeeMinor;

    // Create order ID
    const orderId = generateOrderId();

    // Return mock checkout response
    const response = {
      success: true,
      orderId,
      status: "pending",
      cartId: cart.id,
      items,
      pricing: {
        subtotalMinor,
        taxMinor,
        deliveryFeeMinor,
        totalMinor,
        currency: cart.currency,
      },
      owner: {
        userId: payload.userId ?? null,
        guestId: payload.guestId ?? null,
      },
      timestamps: {
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 minutes
      },
      paymentMethods: getAvailablePaymentProviders().map((provider) => provider.toLowerCase()),
      nextStep: "Select payment method",
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Invalid checkout request",
          details: error.errors.map((e) => ({
            path: e.path.join("."),
            message: e.message,
          })),
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to process checkout",
      },
      { status: 500 }
    );
  }
}
