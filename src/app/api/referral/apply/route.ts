import { NextResponse, type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { referralApplySchema } from "@/lib/validation/payloads";
import { applyReferralCode } from "@/features/loyalty/services/loyaltyService";

export async function POST(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  if (!token?.sub) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const payload = referralApplySchema.parse(body);
    const referral = await applyReferralCode({
      userId: String(token.sub),
      code: payload.code
    });

    return NextResponse.json({ success: true, referralId: referral.id });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to apply referral" },
      { status: 400 }
    );
  }
}
