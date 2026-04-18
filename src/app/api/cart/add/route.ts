import { NextResponse } from "next/server";
import { addCartItem, getOrCreateCart } from "@/features/cart/services/cartService";
import { addCartItemSchema, cartOwnerSchema } from "@/lib/validation/payloads";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const owner = cartOwnerSchema.parse({
      userId: body.userId,
      guestId: body.guestId
    });
    const payload = addCartItemSchema.parse(body);

    const cart = await getOrCreateCart(owner);
    const item = await addCartItem(cart.id, {
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
