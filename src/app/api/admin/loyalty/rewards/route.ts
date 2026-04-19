import { NextResponse, type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { createRewardSchema, updateRewardSchema } from "@/lib/validation/payloads";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  if (!token?.sub || token.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const rewards = await prisma.reward.findMany({ orderBy: { createdAt: "desc" } });
    return NextResponse.json({ rewards });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load rewards" },
      { status: 400 }
    );
  }
}

export async function POST(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  if (!token?.sub || token.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const payload = createRewardSchema.parse(body);
    const reward = await prisma.reward.create({
      data: {
        type: payload.type,
        label: payload.label,
        description: payload.description,
        costPoints: payload.costPoints,
        valueAmountMinor: payload.valueAmountMinor,
        valuePercent: payload.valuePercent,
        menuItemId: payload.menuItemId,
        minTier: payload.minTier ?? "BRONZE",
        isActive: payload.isActive ?? true,
        startsAt: payload.startsAt ? new Date(payload.startsAt) : null,
        endsAt: payload.endsAt ? new Date(payload.endsAt) : null
      }
    });

    return NextResponse.json({ reward });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create reward" },
      { status: 400 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  if (!token?.sub || token.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const payload = updateRewardSchema.parse(body);
    const reward = await prisma.reward.update({
      where: { id: payload.id },
      data: {
        type: payload.type,
        label: payload.label,
        description: payload.description,
        costPoints: payload.costPoints,
        valueAmountMinor: payload.valueAmountMinor,
        valuePercent: payload.valuePercent,
        menuItemId: payload.menuItemId,
        minTier: payload.minTier,
        isActive: payload.isActive,
        startsAt: payload.startsAt ? new Date(payload.startsAt) : undefined,
        endsAt: payload.endsAt ? new Date(payload.endsAt) : undefined
      }
    });

    return NextResponse.json({ reward });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update reward" },
      { status: 400 }
    );
  }
}
