import { NextResponse } from "next/server";
import { cartOwnerSchema } from "@/lib/validation/payloads";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const { cartService } = await import("@/features/cart/services/cartService");
  try {
    const url = new URL(request.url);
    const payload = cartOwnerSchema.parse({
      userId: url.searchParams.get("userId") ?? undefined,
      guestId: url.searchParams.get("guestId") ?? undefined
    });

    const cart = await cartService.getActiveCart(payload);
    return NextResponse.json({ cart });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load cart" },
      { status: 400 }
    );
  }
}
