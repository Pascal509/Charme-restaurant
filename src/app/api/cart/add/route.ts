import { NextResponse } from "next/server";
import { addCartItemSchema, cartOwnerSchema } from "@/lib/validation/payloads";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  const { cartService } = await import("@/features/cart/services/cartService");
  try {
    const body = await request.json();
    const owner = cartOwnerSchema.parse({
      userId: body.userId,
      guestId: body.guestId
    });
    const payload = addCartItemSchema.parse(body);

    const cart = await cartService.getOrCreateCart(owner);
    const item = await cartService.addCartItem(cart.id, {
      productVariantId: payload.productVariantId,
      menuItemId: payload.menuItemId,
      quantity: payload.quantity,
      selectedOptions: payload.selectedOptions
    });

    return NextResponse.json({ cartId: cart.id, item }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to add item" },
      { status: 400 }
    );
  }
}
