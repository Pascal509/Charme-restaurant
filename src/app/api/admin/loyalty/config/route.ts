import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { loyaltyConfigSchema } from "@/lib/validation/payloads";
import { getLoyaltyConfig, updateLoyaltyConfig } from "@/features/loyalty/services/loyaltyService";

export async function GET(request: Request) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  if (!token?.sub || token.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const config = await getLoyaltyConfig();
    return NextResponse.json({ config });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load loyalty config" },
      { status: 400 }
    );
  }
}

export async function PUT(request: Request) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  if (!token?.sub || token.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const payload = loyaltyConfigSchema.parse(body);
    const config = await updateLoyaltyConfig({ payload });
    return NextResponse.json({ config });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update loyalty config" },
      { status: 400 }
    );
  }
}
