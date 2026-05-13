import { NextResponse } from "next/server";
import { idParamSchema } from "@/lib/validation/requests";
import { updateMenuCategorySchema } from "@/lib/validation/payloads";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function PUT(request: Request, context: { params: { id: string } }) {
  const { updateMenuCategory } = await import("@/features/menu/services/adminMenuService");
  try {
    const params = idParamSchema.parse(context.params);
    const body = await request.json();
    const payload = updateMenuCategorySchema.parse(body);

    const category = await updateMenuCategory({
      id: params.id,
      name: payload.name,
      description: payload.description,
      displayOrder: payload.displayOrder,
      isActive: payload.isActive,
      parentId: payload.parentId ?? null
    });

    return NextResponse.json({ category });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update category" },
      { status: 400 }
    );
  }
}

export async function DELETE(_request: Request, context: { params: { id: string } }) {
  const { deleteMenuCategory } = await import("@/features/menu/services/adminMenuService");
  try {
    const params = idParamSchema.parse(context.params);
    const category = await deleteMenuCategory(params.id);
    return NextResponse.json({ category });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete category" },
      { status: 400 }
    );
  }
}
