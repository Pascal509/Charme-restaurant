import MarketPage from "@/features/market/components/MarketPage";
import { buildRuntimeMarketCategories } from "@/lib/catalog";

export async function generateMetadata({ params }: { params: { locale: string; country: string } }) {
  const meta = await import("@/lib/seo/metadata");
  return meta.buildLocalizedMetadata({
    params,
    title: "Market | Charme Restaurant",
    description: "Explore curated Asian groceries, pantry staples, and tea essentials at Charme Market.",
    pathname: `/${params.locale}/${params.country}/market`
  });
}

export default async function MarketRoute({ params }: { params: { locale: string; country: string } }) {
  const categories = await buildRuntimeMarketCategories();
  return <MarketPage categories={categories} locale={params.locale} />;
}
