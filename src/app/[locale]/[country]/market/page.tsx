import MarketPage from "@/features/market/components/MarketPage";
import { buildRuntimeMarketCategories } from "@/lib/catalog";

export default async function MarketRoute() {
  const categories = await buildRuntimeMarketCategories();
  return <MarketPage categories={categories} />;
}
