import { NextResponse } from "next/server";
import { verifyStripeSignature } from "@/features/payment/services/providers/stripeGateway";
import { updatePaymentFromWebhook } from "@/features/payment/services/paymentService";
import { log } from "@/lib/logger";

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const payload = await request.text();
  let event: ReturnType<typeof verifyStripeSignature>;

  try {
    event = verifyStripeSignature(payload, signature);
  } catch (error) {
    log("warn", "Stripe webhook signature verification failed", {
      error: error instanceof Error ? error.message : "Unknown error"
    });
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const eventId = event.id;
  const dataObject = event.data.object as {
    id: string;
    amount_total?: number;
    amount_received?: number;
    currency?: string;
    payment_intent?: string | null;
    status?: string;
  };

  const providerPaymentId = dataObject.id;

  const amountMinor =
    typeof dataObject.amount_total === "number"
      ? dataObject.amount_total
      : dataObject.amount_received ?? 0;
  const currency = (dataObject.currency ?? "NGN").toUpperCase();

  const status =
    event.type === "checkout.session.completed"
      ? "PAID"
      : event.type === "payment_intent.payment_failed"
      ? "FAILED"
      : "PENDING";

  const result = await updatePaymentFromWebhook({
    provider: "STRIPE",
    eventId,
    providerPaymentId,
    status,
    amountMinor,
    currency,
    payload
  });

  log("info", "Stripe webhook processed", {
    eventId,
    providerPaymentId,
    status,
    result: result.status
  });

  return NextResponse.json({ received: true });
}
