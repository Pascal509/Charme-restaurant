import { NextResponse } from "next/server";
import { verifyFlutterwaveSignature } from "@/features/payment/services/providers/flutterwaveGateway";
import { processFlutterwaveCallback } from "@/features/payment/services/flutterwaveCallbackService";
import { log } from "@/lib/logger";

export async function POST(request: Request) {
  const signature = request.headers.get("verif-hash");
  if (!verifyFlutterwaveSignature(signature)) {
    log("warn", "Flutterwave webhook signature verification failed", {
      signature: signature ? "present" : "missing"
    });
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const payload = await request.text();
  const body = JSON.parse(payload) as {
    event: string;
    data: {
      id: number;
      tx_ref?: string;
    };
  };

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
}
