import { NextResponse } from "next/server";
import { idParamSchema } from "@/lib/validation/requests";
import { updateCartItemSchema } from "@/lib/validation/payloads";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function PUT(request: Request, context: { params: { id: string } }) {
  const { cartService } = await import("@/features/cart/services/cartService");
  try {
    const params = idParamSchema.parse(context.params);
    const body = await request.json();
    const payload = updateCartItemSchema.parse(body);

    const item = await cartService.updateCartItemQuantity(params.id, payload.quantity);
    return NextResponse.json({ item });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update cart item" },
      { status: 400 }
    );
  }
}

export async function DELETE(_request: Request, context: { params: { id: string } }) {
  const { cartService } = await import("@/features/cart/services/cartService");
  try {
    const params = idParamSchema.parse(context.params);
    const item = await cartService.removeCartItem(params.id);
    return NextResponse.json({ item });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to remove cart item" },
      { status: 400 }
    );
  }
}
