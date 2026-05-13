import { NextResponse, type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const { prisma } = await import("@/lib/db");
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  if (!token?.sub) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const orders = await prisma.order.findMany({
      where: { userId: token.sub },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        status: true,
        paymentStatus: true,
        orderType: true,
        displayCurrency: true,
        subtotalAmountMinor: true,
        taxAmountMinor: true,
        deliveryFeeAmountMinor: true,
        totalAmountMinor: true,
        createdAt: true,
        items: {
          select: {
            id: true,
            quantity: true,
            unitAmountMinor: true,
            currency: true,
            menuItemId: true,
            productVariantId: true,
            menuItem: { select: { title: true } },
            productVariant: { select: { title: true } }
          }
        }
      }
    });

    return NextResponse.json({ orders });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load orders" },
      { status: 400 }
    );
  }
}
