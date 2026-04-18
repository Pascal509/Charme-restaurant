import Flutterwave from "flutterwave-node-v3";
import { env } from "@/lib/env";
import type { PaymentGateway, PaymentSessionRequest, PaymentSessionResponse } from "@/features/payment/services/paymentGateway";
import { Money } from "@/lib/money";

const flutterwave = new (Flutterwave as unknown as {
  new (
    publicKey: string,
    secretKey: string
  ): {
    Payment: {
      create: (payload: Record<string, unknown>) => Promise<{ data: { link: string; id: string } }>;
    };
  };
})(env.FLUTTERWAVE_PUBLIC_KEY, env.FLUTTERWAVE_SECRET_KEY);

export class FlutterwaveGateway implements PaymentGateway {
  async createSession(request: PaymentSessionRequest): Promise<PaymentSessionResponse> {
    const money = new Money(request.amountMinor, request.currency);
    const response = await flutterwave.Payment.create({
      tx_ref: request.orderId,
      amount: money.formatMajor(),
      currency: request.currency,
      redirect_url: env.FLUTTERWAVE_REDIRECT_URL,
      payment_options: "card,banktransfer,ussd",
      customer: {
        email: "guest@charme.com"
      },
      customizations: {
        title: "Charme Order",
        description: "Charme Supermarket and Restaurant"
      }
    });

    return {
      provider: "FLUTTERWAVE",
      sessionId: String(response.data.id),
      redirectUrl: response.data.link
    };
  }
}

export function verifyFlutterwaveSignature(signature: string | null) {
  return signature === env.FLUTTERWAVE_WEBHOOK_SECRET;
}
