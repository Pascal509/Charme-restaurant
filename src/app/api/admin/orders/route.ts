import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/db";

const ACTIVE_STATUSES = [
  "PENDING",
  "ACCEPTED",
  "PREPARING",
  "READY",
  "OUT_FOR_DELIVERY"
] as const;

export async function GET(request: Request) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  if (!token?.sub || token.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const orders = await prisma.order.findMany({
      where: { status: { in: ACTIVE_STATUSES } },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        status: true,
        orderType: true,
        paymentStatus: true,
        displayCurrency: true,
        subtotalAmountMinor: true,
        taxAmountMinor: true,
        deliveryFeeAmountMinor: true,
        totalAmountMinor: true,
        createdAt: true,
        user: { select: { name: true, email: true } },
        items: {
          select: {
            id: true,
            quantity: true,
            unitAmountMinor: true,
            currency: true,
            menuItem: { select: { title: true } }
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
