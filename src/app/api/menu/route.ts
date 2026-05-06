import { NextResponse } from "next/server";
import { buildRuntimeMenuCategories } from "@/lib/catalog";

export async function GET() {
  const categories = await buildRuntimeMenuCategories();
  return NextResponse.json({ categories });
}
