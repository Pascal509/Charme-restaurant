import { NextResponse } from "next/server";
import { transitionOrderStatus } from "@/features/orders/services/orderWorkflowService";

export async function POST(_request: Request, context: { params: { id: string } }) {
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
