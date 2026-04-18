import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { Money } from "@/lib/money";

export async function resolveMenuId(menuId?: string) {
  if (menuId) return menuId;

  const existing = await prisma.menu.findFirst({ orderBy: { createdAt: "asc" } });
  if (existing) return existing.id;

  const created = await prisma.menu.create({
    data: {
      name: "Main Menu",
      description: "Default menu"
    }
  });

  return created.id;
}

export async function createMenuCategory(params: {
  name: string;
  description?: string;
  displayOrder?: number;
  isActive?: boolean;
  parentId?: string | null;
  menuId?: string;
}) {
  const menuId = await resolveMenuId(params.menuId);
  const slug = slugify(params.name);

  return prisma.menuCategory.create({
    data: {
      menuId,
      name: params.name,
      slug,
      description: params.description,
      displayOrder: params.displayOrder ?? 0,
      isActive: params.isActive ?? true,
      parentId: params.parentId ?? undefined
    }
  });
}

export async function updateMenuCategory(params: {
  id: string;
  name?: string;
  description?: string;
  displayOrder?: number;
  isActive?: boolean;
  parentId?: string | null;
}) {
  const data: Record<string, unknown> = {
    description: params.description,
    displayOrder: params.displayOrder,
    isActive: params.isActive,
    parentId: params.parentId ?? undefined
  };

  if (params.name) {
    data.name = params.name;
    data.slug = slugify(params.name);
  }

  return prisma.menuCategory.update({
    where: { id: params.id },
    data
  });
}

export async function deleteMenuCategory(id: string) {
  return prisma.menuCategory.delete({ where: { id } });
}

export async function createMenuItem(params: {
  name: string;
  description?: string;
  price: number;
  currency?: string;
  imageUrl?: string;
  categoryId: string;
  isAvailable?: boolean;
  preparationTime?: number;
  menuId?: string;
  optionGroupIds?: string[];
}) {
  const menuId = await resolveMenuId(params.menuId);
  const slug = slugify(params.name);
  const currency = (params.currency ?? env.BASE_CURRENCY).toUpperCase();
  const priceMinor = Money.fromMajor(params.price, currency).amountMinor;

  const item = await prisma.menuItem.create({
    data: {
      menuId,
      slug,
      title: params.name,
      description: params.description,
      imageUrl: params.imageUrl,
      baseAmountMinor: priceMinor,
      baseCurrency: currency,
      isAvailable: params.isAvailable ?? true,
      preparationTimeMins: params.preparationTime,
      categories: {
        create: [{ menuCategoryId: params.categoryId }]
      }
    }
  });

  if (params.optionGroupIds && params.optionGroupIds.length > 0) {
    await prisma.menuItemModifierGroup.createMany({
      data: params.optionGroupIds.map((modifierGroupId) => ({
        menuItemId: item.id,
        modifierGroupId
      })),
      skipDuplicates: true
    });
  }

  return item;
}

export async function updateMenuItem(params: {
  id: string;
  name?: string;
  description?: string;
  price?: number;
  currency?: string;
  imageUrl?: string;
  categoryId?: string;
  isAvailable?: boolean;
  preparationTime?: number;
  optionGroupIds?: string[];
}) {
  const data: Record<string, unknown> = {
    description: params.description,
    imageUrl: params.imageUrl,
    isAvailable: params.isAvailable,
    preparationTimeMins: params.preparationTime
  };

  if (params.name) {
    data.title = params.name;
    data.slug = slugify(params.name);
  }

  if (params.price !== undefined) {
    const currency = (params.currency ?? env.BASE_CURRENCY).toUpperCase();
    data.baseAmountMinor = Money.fromMajor(params.price, currency).amountMinor;
    data.baseCurrency = currency;
  }

  const item = await prisma.menuItem.update({
    where: { id: params.id },
    data
  });

  if (params.categoryId) {
    await prisma.menuItemCategory.deleteMany({ where: { menuItemId: item.id } });
    await prisma.menuItemCategory.create({
      data: { menuItemId: item.id, menuCategoryId: params.categoryId }
    });
  }

  if (params.optionGroupIds) {
    await prisma.menuItemModifierGroup.deleteMany({ where: { menuItemId: item.id } });
    if (params.optionGroupIds.length > 0) {
      await prisma.menuItemModifierGroup.createMany({
        data: params.optionGroupIds.map((modifierGroupId) => ({
          menuItemId: item.id,
          modifierGroupId
        })),
        skipDuplicates: true
      });
    }
  }

  return item;
}

export async function deleteMenuItem(id: string) {
  return prisma.menuItem.delete({ where: { id } });
}

export async function listMenuCategories(params: { menuId?: string; includeItems?: boolean }) {
  const menuId = await resolveMenuId(params.menuId);

  return prisma.menuCategory.findMany({
    where: { menuId, isActive: true },
    orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
    include: params.includeItems
      ? {
          items: {
            where: { menuItem: { isAvailable: true } },
            include: { menuItem: true }
          }
        }
      : undefined
  });
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}
