import { prisma } from "@/lib/db";

export async function createMenuCategory(params: {
  menuId: string;
  name: string;
  slug: string;
  parentId?: string | null;
}) {
  return prisma.menuCategory.create({
    data: {
      menuId: params.menuId,
      name: params.name,
      slug: params.slug,
      parentId: params.parentId ?? undefined
    }
  });
}

export async function listMenuCategories(menuId: string) {
  return prisma.menuCategory.findMany({
    where: { menuId },
    orderBy: { name: "asc" }
  });
}
