import { NextResponse } from "next/server";
import { getCatalogService } from "@/lib/catalog";
import { getCatalogRuntimeStatus } from "@/features/catalog/services/catalogService";

export async function GET() {
  try {
    const svc = getCatalogService();
    const menus = await svc.listMenuCategories();
    const markets = await svc.listMarketCategories();
    const runtime = getCatalogRuntimeStatus();

    return NextResponse.json({
      configuredSource: runtime.configuredSource,
      activeSource: runtime.activeSource,
      fallbackActive: runtime.fallbackActive,
      fallbackReason: runtime.fallbackReason,
      menuCategories: menus.length,
      marketCategories: markets.length,
      sampleMenu: menus.slice(0, 3).map((c) => ({ id: c.id, name: c.name, items: c.items.length })),
      sampleMarket: markets.slice(0, 3).map((c) => ({ id: c.id, name: c.name, products: c.products.length }))
    });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "unknown" }, { status: 500 });
  }
}

