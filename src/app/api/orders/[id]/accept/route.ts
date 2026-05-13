import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(_request: Request, context: { params: { id: string } }) {
  const { transitionOrderStatus } = await import("@/features/orders/services/orderWorkflowService");
  try {
    const order = await transitionOrderStatus({
      orderId: context.params.id,
      nextStatus: "ACCEPTED"
    });

    return NextResponse.json({ order });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to accept order" },
      { status: 400 }
    );
  }
}
