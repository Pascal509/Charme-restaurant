import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/db";
import type { NotificationChannel, NotificationType } from "@/features/notifications/types";

export async function GET(request: Request) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  if (!token?.sub) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const preferences = await prisma.notificationPreference.findMany({
      where: { userId: token.sub },
      select: {
        type: true,
        channel: true,
        enabled: true
      }
    });

    return NextResponse.json({ preferences });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load preferences" },
      { status: 400 }
    );
  }
}

export async function PUT(request: Request) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  if (!token?.sub) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const type = body.type as NotificationType | undefined;
    const channel = body.channel as NotificationChannel | undefined;
    const enabled = Boolean(body.enabled);

    if (!type || !channel) {
      return NextResponse.json({ error: "type and channel required" }, { status: 400 });
    }

    const preference = await prisma.notificationPreference.upsert({
      where: {
        userId_type_channel: {
          userId: token.sub,
          type,
          channel
        }
      },
      update: { enabled },
      create: {
        userId: token.sub,
        type,
        channel,
        enabled
      }
    });

    return NextResponse.json({ preference });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update preference" },
      { status: 400 }
    );
  }
}
