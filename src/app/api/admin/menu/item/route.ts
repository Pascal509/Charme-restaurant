import { NextResponse } from "next/server";
import { createMenuItemSchema } from "@/lib/validation/payloads";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  const { createMenuItem } = await import("@/features/menu/services/adminMenuService");
  try {
    const body = await request.json();
    const payload = createMenuItemSchema.parse(body);

    const item = await createMenuItem({
      name: payload.name,
      description: payload.description,
      price: payload.price,
      currency: payload.currency,
      imageUrl: payload.imageUrl,
      categoryId: payload.categoryId,
      isAvailable: payload.isAvailable,
      preparationTime: payload.preparationTime,
      menuId: payload.menuId,
      optionGroupIds: payload.optionGroupIds
    });

    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create item" },
      { status: 400 }
    );
  }
}
