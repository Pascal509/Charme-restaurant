import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/db";

const DEFAULT_DAYS = 30;
const MAX_DAYS = 90;

export async function GET(request: Request) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  if (!token?.sub || token.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const url = new URL(request.url);
    const days = Math.min(
      Math.max(Number(url.searchParams.get("days") ?? DEFAULT_DAYS), 1),
      MAX_DAYS
    );

    const start = new Date();
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - (days - 1));

    const dailyRows = await prisma.$queryRaw<
      Array<{ date: Date; orders: number; revenue: number; aov: number }>
    >`
      SELECT "date", "orders", "revenue", "aov"
      FROM "DailySalesAgg"
      WHERE "date" >= ${start}
      ORDER BY "date" ASC
    `;

    const totals = dailyRows.reduce(
      (acc, row) => {
        const orders = Number(row.orders ?? 0);
        const revenue = Number(row.revenue ?? 0);
        acc.orderCount += orders;
        acc.revenue += revenue;
        return acc;
      },
      { orderCount: 0, revenue: 0 }
    );

    const topItems = await prisma.$queryRaw<
      Array<{ menuItemId: string; quantity: number; revenueMinor: number }>
    >`
      SELECT "menuItemId", SUM("quantity")::int AS "quantity",
        SUM("unitAmountMinor" * "quantity")::bigint AS "revenueMinor"
      FROM "OrderItem"
      JOIN "Order" ON "Order"."id" = "OrderItem"."orderId"
      WHERE "menuItemId" IS NOT NULL
        AND "Order"."paymentStatus" = 'PAID'
        AND "Order"."createdAt" >= ${start}
      GROUP BY "menuItemId"
      ORDER BY "quantity" DESC
      LIMIT 8
    `;

    const itemIds = topItems.map((item) => item.menuItemId);
    const menuItems = itemIds.length
      ? await prisma.menuItem.findMany({
          where: { id: { in: itemIds } },
          select: { id: true, title: true }
        })
      : [];

    const nameMap = new Map(menuItems.map((item) => [item.id, item.title]));

    const currencySample = await prisma.order.findFirst({
      where: { createdAt: { gte: start } },
      select: { displayCurrency: true },
      orderBy: { createdAt: "desc" }
    });

    const loyaltyTotals = await prisma.loyaltyTransaction.groupBy({
      by: ["type"],
      where: { createdAt: { gte: start } },
      _sum: { points: true }
    });

    const loyaltySummary = loyaltyTotals.reduce(
      (acc, row) => {
        const points = Number(row._sum.points ?? 0);
        if (row.type === "EARN" || row.type === "REFERRAL_BONUS") {
          acc.earned += points;
        } else if (row.type === "REDEEM") {
          acc.redeemed += points;
        } else if (row.type === "EXPIRE") {
          acc.expired += points;
        }
        return acc;
      },
      { earned: 0, redeemed: 0, expired: 0 }
    );

    const repeatStats = await prisma.$queryRaw<
      Array<{ repeat_users: number; total_users: number }>
    >`
      SELECT
        COUNT(*) FILTER (WHERE "order_count" >= 2) AS repeat_users,
        COUNT(*) AS total_users
      FROM (
        SELECT "userId", COUNT(*) AS order_count
        FROM "Order"
        WHERE "paymentStatus" = 'PAID'
          AND "userId" IS NOT NULL
          AND "createdAt" >= ${start}
        GROUP BY "userId"
      ) AS user_orders
    `;

    const repeatUsers = Number(repeatStats[0]?.repeat_users ?? 0);
    const totalUsers = Number(repeatStats[0]?.total_users ?? 0);
    const repeatPurchaseRate = totalUsers > 0 ? repeatUsers / totalUsers : 0;

    return NextResponse.json({
      rangeStart: start.toISOString(),
      rangeDays: days,
      currency: currencySample?.displayCurrency ?? "NGN",
      summary: {
        revenueMinor: totals.revenue,
        orderCount: totals.orderCount,
        averageOrderValueMinor:
          totals.orderCount > 0 ? Math.round(totals.revenue / totals.orderCount) : 0
      },
      loyalty: {
        pointsEarned: loyaltySummary.earned,
        pointsRedeemed: loyaltySummary.redeemed,
        pointsExpired: loyaltySummary.expired,
        repeatPurchaseRate
      },
      daily: dailyRows.map((row) => ({
        date: row.date instanceof Date ? row.date.toISOString() : String(row.date),
        revenueMinor: Number(row.revenue ?? 0),
        orderCount: Number(row.orders ?? 0),
        averageOrderValueMinor: Number(row.aov ?? 0)
      })),
      topItems: topItems.map((item) => ({
        menuItemId: item.menuItemId,
        name: nameMap.get(item.menuItemId) ?? "Item",
        quantity: Number(item.quantity ?? 0),
        revenueMinor: Number(item.revenueMinor ?? 0)
      }))
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load analytics" },
      { status: 400 }
    );
  }
}
