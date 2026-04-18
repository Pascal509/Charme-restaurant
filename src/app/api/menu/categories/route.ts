import { NextResponse } from "next/server";
import { listMenuCategories } from "@/features/menu/services/adminMenuService";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const menuId = url.searchParams.get("menuId") ?? undefined;

  const categories = await listMenuCategories({ menuId, includeItems: false });

  return NextResponse.json({
    categories: categories.map((category) => ({
      id: category.id,
      name: category.name,
      description: category.description,
      displayOrder: category.displayOrder,
      isActive: category.isActive
    }))
  });
}
