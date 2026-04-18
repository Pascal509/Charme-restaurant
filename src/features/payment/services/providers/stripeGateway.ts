import Stripe from "stripe";
import { env } from "@/lib/env";
import type { PaymentGateway, PaymentSessionRequest, PaymentSessionResponse } from "@/features/payment/services/paymentGateway";

const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-06-20"
});

export class StripeGateway implements PaymentGateway {
  async createSession(request: PaymentSessionRequest): Promise<PaymentSessionResponse> {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      success_url: env.STRIPE_SUCCESS_URL,
      cancel_url: env.STRIPE_CANCEL_URL,
      currency: request.currency.toLowerCase(),
      client_reference_id: request.orderId,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: request.currency.toLowerCase(),
            unit_amount: request.amountMinor,
            product_data: {
              name: "Charme Order"
            }
          }
        }
      ]
    });

    return {
      provider: "STRIPE",
      sessionId: session.id,
      redirectUrl: session.url ?? undefined
    };
  }
}

export function verifyStripeSignature(payload: string, signature: string) {
  return stripe.webhooks.constructEvent(payload, signature, env.STRIPE_WEBHOOK_SECRET);
}
