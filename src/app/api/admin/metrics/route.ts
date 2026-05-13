import { NextResponse, type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const { prisma } = await import("@/lib/db");
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  if (!token?.sub || token.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const [stats, sample] = await Promise.all([
      prisma.order.aggregate({
        where: { createdAt: { gte: start }, paymentStatus: "PAID" },
        _count: { id: true },
        _sum: { totalAmountMinor: true }
      }),
      prisma.order.findFirst({
        where: { createdAt: { gte: start } },
        select: { displayCurrency: true },
        orderBy: { createdAt: "desc" }
      })
    ]);

    return NextResponse.json({
      todayOrderCount: stats._count.id ?? 0,
      todayRevenueMinor: stats._sum.totalAmountMinor ?? 0,
      currency: sample?.displayCurrency ?? "NGN"
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load metrics" },
      { status: 400 }
    );
  }
}
