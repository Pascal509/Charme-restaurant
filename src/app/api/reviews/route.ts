import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/db";
import { validateOrThrow } from "@/lib/validation";
import { createReviewSchema } from "@/lib/validation/payloads";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const itemId = url.searchParams.get("itemId");

  if (!itemId) {
    return NextResponse.json({ error: "itemId is required" }, { status: 400 });
  }

  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

  try {
    const [reviews, aggregates] = await Promise.all([
      prisma.review.findMany({
        where: { menuItemId: itemId },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          rating: true,
          comment: true,
          createdAt: true,
          user: { select: { name: true } }
        }
      }),
      prisma.review.aggregate({
        where: { menuItemId: itemId },
        _avg: { rating: true },
        _count: { rating: true }
      })
    ]);

    let canReview = false;
    let hasReviewed = false;

    if (token?.sub) {
      const existing = await prisma.review.findFirst({
        where: { menuItemId: itemId, userId: token.sub },
        select: { id: true }
      });

      hasReviewed = Boolean(existing);

      if (!existing) {
        const delivered = await prisma.order.findFirst({
          where: {
            userId: token.sub,
            status: "DELIVERED",
            items: { some: { menuItemId: itemId } }
          },
          select: { id: true }
        });
        canReview = Boolean(delivered);
      }
    }

    return NextResponse.json({
      reviews,
      averageRating: aggregates._avg.rating ?? 0,
      reviewCount: aggregates._count.rating ?? 0,
      canReview,
      hasReviewed
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load reviews" },
      { status: 400 }
    );
  }
}

export async function POST(request: Request) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  if (!token?.sub) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const payload = validateOrThrow(createReviewSchema, await request.json());

    const existing = await prisma.review.findFirst({
      where: { menuItemId: payload.menuItemId, userId: token.sub },
      select: { id: true }
    });

    if (existing) {
      return NextResponse.json({ error: "You already reviewed this item." }, { status: 409 });
    }

    const delivered = await prisma.order.findFirst({
      where: {
        userId: token.sub,
        status: "DELIVERED",
        items: { some: { menuItemId: payload.menuItemId } }
      },
      select: { id: true }
    });

    if (!delivered) {
      return NextResponse.json(
        { error: "Only delivered orders can be reviewed." },
        { status: 403 }
      );
    }

    const review = await prisma.review.create({
      data: {
        userId: token.sub,
        menuItemId: payload.menuItemId,
        rating: payload.rating,
        comment: payload.comment
      },
      select: {
        id: true,
        rating: true,
        comment: true,
        createdAt: true,
        user: { select: { name: true } }
      }
    });

    return NextResponse.json({ review });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create review" },
      { status: 400 }
    );
  }
}
