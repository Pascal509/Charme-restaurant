import { NextResponse, type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/db";
import { resolveMenuId } from "@/features/menu/services/adminMenuService";

export async function GET(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  if (!token?.sub || token.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const url = new URL(request.url);
    const menuIdParam = url.searchParams.get("menuId") ?? undefined;
    const menuId = await resolveMenuId(menuIdParam);

    const categories = await prisma.menuCategory.findMany({
      where: { menuId },
      orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
      include: {
        items: {
          include: {
            menuItem: true
          }
        }
      }
    });

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
        preparationTime: entry.menuItem.preparationTimeMins
      }))
    }));

    return NextResponse.json({ categories: payload });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load menu" },
      { status: 400 }
    );
  }
}
