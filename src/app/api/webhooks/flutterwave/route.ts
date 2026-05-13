import { NextResponse } from "next/server";
import { log } from "@/lib/logger";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  const { verifyFlutterwaveSignature } = await import("@/features/payment/services/providers/flutterwaveGateway");
  const { processFlutterwaveCallback } = await import("@/features/payment/services/flutterwaveCallbackService");
  const signature = request.headers.get("verif-hash");
  if (!verifyFlutterwaveSignature(signature)) {
    log("warn", "Flutterwave webhook signature verification failed", {
      signature: signature ? "present" : "missing"
    });
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    const payload = await request.text();
    const body = JSON.parse(payload) as {
      event?: string;
      data?: {
        id?: number;
        tx_ref?: string;
      };
    };

    if (!body.data?.id) {
      return NextResponse.json({ error: "Missing transaction id" }, { status: 400 });
    }

    const result = await processFlutterwaveCallback({
      transactionId: String(body.data.id),
      reference: body.data.tx_ref ?? null,
      payload
    });

    log("info", "Flutterwave webhook processed", {
      eventId: result.transactionId,
      reference: result.reference,
      status: result.status,
      result: result.updateStatus
    });

    return NextResponse.json({ received: true });
  } catch (error) {
    log("error", "Flutterwave webhook processing failed", {
      error: error instanceof Error ? error.message : "Unknown error"
    });
    return NextResponse.json({ error: "Invalid webhook payload" }, { status: 400 });
  }
}
