import { NextResponse } from "next/server";
import { createMenuCategorySchema } from "@/lib/validation/payloads";
import { createMenuCategory } from "@/features/menu/services/adminMenuService";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const payload = createMenuCategorySchema.parse(body);

    const category = await createMenuCategory({
      name: payload.name,
      description: payload.description,
      displayOrder: payload.displayOrder,
      isActive: payload.isActive,
      parentId: payload.parentId ?? null,
      menuId: payload.menuId
    });

    return NextResponse.json({ category }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create category" },
      { status: 400 }
    );
  }
}
