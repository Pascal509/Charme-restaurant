import { NextResponse } from "next/server";
import { buildRuntimeMenuCategories } from "@/lib/catalog";

export async function GET(request: Request) {
  const categories = await buildRuntimeMenuCategories();
  return NextResponse.json({ categories });
}
