import MenuPage from "@/features/menu/components/MenuPage";
import { buildRuntimeMenuCategories } from "@/lib/catalog";

export default async function MenuRoute() {
  const categories = await buildRuntimeMenuCategories();
  return <MenuPage categories={categories} />;
}
