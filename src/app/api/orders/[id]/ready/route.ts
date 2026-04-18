import { NextResponse } from "next/server";
import { transitionOrderStatus } from "@/features/orders/services/orderWorkflowService";

export async function POST(_request: Request, context: { params: { id: string } }) {
  try {
    const order = await transitionOrderStatus({
      orderId: context.params.id,
      nextStatus: "READY"
    });

    return NextResponse.json({ order });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to mark ready" },
      { status: 400 }
    );
  }
}
