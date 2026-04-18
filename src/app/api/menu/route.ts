import { NextResponse } from "next/server";
import { listMenuCategories } from "@/features/menu/services/adminMenuService";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const menuId = url.searchParams.get("menuId") ?? undefined;

  const categories = await listMenuCategories({ menuId, includeItems: true });

  const itemIds = categories
    .flatMap((category) => category.items.map((entry) => entry.menuItem.id));

  const reviewStats = itemIds.length
    ? await prisma.review.groupBy({
        by: ["menuItemId"],
        where: { menuItemId: { in: itemIds } },
        _avg: { rating: true },
        _count: { rating: true }
      })
    : [];

  const reviewMap = new Map(
    reviewStats.map((stat) => [
      stat.menuItemId,
      {
        averageRating: stat._avg.rating ?? 0,
        reviewCount: stat._count.rating ?? 0
      }
    ])
  );

  const payload = categories.map((category) => ({
    id: category.id,
    name: category.name,
    description: category.description,
    displayOrder: category.displayOrder,
    isActive: category.isActive,
    items: category.items.map((entry) => ({
      id: entry.menuItem.id,
      name: entry.menuItem.title,
      description: entry.menuItem.description,
      priceMinor: entry.menuItem.baseAmountMinor,
      currency: entry.menuItem.baseCurrency,
      imageUrl: entry.menuItem.imageUrl,
      isAvailable: entry.menuItem.isAvailable,
      preparationTime: entry.menuItem.preparationTimeMins,
      averageRating: reviewMap.get(entry.menuItem.id)?.averageRating ?? 0,
      reviewCount: reviewMap.get(entry.menuItem.id)?.reviewCount ?? 0
    }))
  }));

  return NextResponse.json({ categories: payload });
}
