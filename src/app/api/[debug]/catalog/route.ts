import { NextResponse } from "next/server";
import { getCatalogService } from "@/lib/catalog";
import { getCatalogRuntimeStatus } from "@/features/catalog/services/catalogService";

export async function GET(
  _request: Request,
  context: { params: { debug: string } }
) {
  if (context.params.debug !== "_debug") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

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
  } catch {
    return NextResponse.json({ error: "Catalog debug data unavailable" }, { status: 500 });
  }
}
