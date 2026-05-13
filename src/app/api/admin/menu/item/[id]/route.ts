import { NextResponse } from "next/server";
import { idParamSchema } from "@/lib/validation/requests";
import { updateMenuItemSchema } from "@/lib/validation/payloads";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function PUT(request: Request, context: { params: { id: string } }) {
  const { updateMenuItem } = await import("@/features/menu/services/adminMenuService");
  try {
    const params = idParamSchema.parse(context.params);
    const body = await request.json();
    const payload = updateMenuItemSchema.parse(body);

    const item = await updateMenuItem({
      id: params.id,
      name: payload.name,
      description: payload.description,
      price: payload.price,
      currency: payload.currency,
      imageUrl: payload.imageUrl,
      categoryId: payload.categoryId,
      isAvailable: payload.isAvailable,
      preparationTime: payload.preparationTime,
      optionGroupIds: payload.optionGroupIds
    });

    return NextResponse.json({ item });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update item" },
      { status: 400 }
    );
  }
}

export async function DELETE(_request: Request, context: { params: { id: string } }) {
  const { deleteMenuItem } = await import("@/features/menu/services/adminMenuService");
  try {
    const params = idParamSchema.parse(context.params);
    const item = await deleteMenuItem(params.id);
    return NextResponse.json({ item });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete item" },
      { status: 400 }
    );
  }
}
