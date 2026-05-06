import { NextResponse } from "next/server";
import { buildRuntimeMenuCategories } from "@/lib/catalog";

export async function GET() {
  const categories = await buildRuntimeMenuCategories();
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
