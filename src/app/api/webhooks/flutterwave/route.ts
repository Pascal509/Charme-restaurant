import { NextResponse } from "next/server";
import { verifyFlutterwaveSignature } from "@/features/payment/services/providers/flutterwaveGateway";
import { updatePaymentFromWebhook } from "@/features/payment/services/paymentService";
import { Money } from "@/lib/money";
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
      amount: number;
      currency: string;
      status: string;
      tx_ref?: string;
    };
  };

  const status = body.data.status === "successful" ? "PAID" : "FAILED";

  const money = Money.fromMajor(body.data.amount, body.data.currency.toUpperCase());

  const result = await updatePaymentFromWebhook({
    provider: "FLUTTERWAVE",
    eventId: String(body.data.id),
    providerPaymentId: String(body.data.id),
    status,
    amountMinor: money.amountMinor,
    currency: body.data.currency.toUpperCase(),
    payload
  });

  log("info", "Flutterwave webhook processed", {
    eventId: String(body.data.id),
    providerPaymentId: String(body.data.id),
    status,
    result: result.status
  });

  return NextResponse.json({ received: true });
}
