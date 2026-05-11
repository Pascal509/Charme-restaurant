import MenuPage from "@/features/menu/components/MenuPage";
import { buildRuntimeMenuCategories } from "@/lib/catalog";

export async function generateMetadata({ params }: { params: { locale: string; country: string } }) {
  const meta = await import("@/lib/seo/metadata");
  return meta.buildLocalizedMetadata({
    params,
    title: "Menu | Charme Restaurant",
    description: "Browse Charme's modern Chinese and Taiwanese menu, curated for dine-in and takeaway.",
    pathname: `/${params.locale}/${params.country}/menu`
  });
}

export default async function MenuRoute({ params }: { params: { locale: string; country: string } }) {
  const categories = await buildRuntimeMenuCategories();
  return <MenuPage categories={categories} locale={params.locale} />;
}
