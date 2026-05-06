import Flutterwave from "flutterwave-node-v3";
import { env } from "@/lib/env";
import type { PaymentGateway, PaymentSessionRequest, PaymentSessionResponse } from "@/features/payment/services/paymentGateway";
import { Money } from "@/lib/money";

export type FlutterwaveVerificationResponse = {
  status: string;
  message?: string;
  data: {
    id: number;
    tx_ref?: string;
    flw_ref?: string;
    amount: number;
    currency: string;
    status: string;
  };
};

type FlutterwaveClient = {
  Payment: {
    create: (payload: Record<string, unknown>) => Promise<{ data: { link: string; id: string } }>;
  };
};

let flutterwaveClient: FlutterwaveClient | null = null;

function getFlutterwaveClient() {
  if (flutterwaveClient) return flutterwaveClient;
  if (!env.FLUTTERWAVE_PUBLIC_KEY || !env.FLUTTERWAVE_SECRET_KEY) {
    throw new Error("Flutterwave credentials missing");
  }

  flutterwaveClient = new (Flutterwave as unknown as {
    new (publicKey: string, secretKey: string): FlutterwaveClient;
  })(env.FLUTTERWAVE_PUBLIC_KEY, env.FLUTTERWAVE_SECRET_KEY);

  return flutterwaveClient;
}

export class FlutterwaveGateway implements PaymentGateway {
  async createSession(request: PaymentSessionRequest): Promise<PaymentSessionResponse> {
    const money = new Money(request.amountMinor, request.currency);
    const flutterwave = getFlutterwaveClient();
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

export async function verifyFlutterwaveTransaction(transactionId: string) {
  if (!env.FLUTTERWAVE_SECRET_KEY) {
    throw new Error("Flutterwave credentials missing");
  }

  const response = await fetch(`https://api.flutterwave.com/v3/transactions/${transactionId}/verify`, {
    headers: {
      Authorization: `Bearer ${env.FLUTTERWAVE_SECRET_KEY}`,
      Accept: "application/json"
    }
  });

  const body = (await response.json()) as Partial<FlutterwaveVerificationResponse>;
  if (!response.ok || body.status !== "success" || !body.data) {
    throw new Error(body.message ?? "Unable to verify Flutterwave transaction");
  }

  return body as FlutterwaveVerificationResponse;
}

export function verifyFlutterwaveSignature(signature: string | null) {
  return signature === env.FLUTTERWAVE_WEBHOOK_SECRET;
}
