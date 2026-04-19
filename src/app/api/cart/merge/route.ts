import { NextResponse, type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { mergeCartSchema } from "@/lib/validation/payloads";
import { mergeCarts } from "@/features/cart/services/cartService";

export async function POST(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  if (!token?.sub) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const payload = mergeCartSchema.parse(body);

    const cart = await mergeCarts(payload.guestId, token.sub);
    return NextResponse.json({ cart });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to merge cart" },
      { status: 400 }
    );
  }
}
