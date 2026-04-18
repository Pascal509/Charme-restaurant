import { NextResponse } from "next/server";
import { idParamSchema } from "@/lib/validation/requests";
import { updateCartItemSchema } from "@/lib/validation/payloads";
import { updateCartItemQuantity, removeCartItem } from "@/features/cart/services/cartService";

export async function PUT(request: Request, context: { params: { id: string } }) {
  try {
    const params = idParamSchema.parse(context.params);
    const body = await request.json();
    const payload = updateCartItemSchema.parse(body);

    const item = await updateCartItemQuantity(params.id, payload.quantity);
    return NextResponse.json({ item });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update cart item" },
      { status: 400 }
    );
  }
}

export async function DELETE(_request: Request, context: { params: { id: string } }) {
  try {
    const params = idParamSchema.parse(context.params);
    const item = await removeCartItem(params.id);
    return NextResponse.json({ item });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to remove cart item" },
      { status: 400 }
    );
  }
}
