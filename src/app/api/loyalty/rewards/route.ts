import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { listAvailableRewards } from "@/features/loyalty/services/loyaltyService";

export async function GET(request: Request) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  if (!token?.sub) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const rewards = await listAvailableRewards(String(token.sub));
    return NextResponse.json({ rewards });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load rewards" },
      { status: 400 }
    );
  }
}
