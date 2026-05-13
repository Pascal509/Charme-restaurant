import { NextResponse } from "next/server";
import { createMenuCategorySchema } from "@/lib/validation/payloads";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  const { createMenuCategory } = await import("@/features/menu/services/adminMenuService");
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
