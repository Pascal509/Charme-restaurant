import { env } from "@/lib/env";
import type { PaymentGateway, PaymentSessionRequest, PaymentSessionResponse } from "@/features/payment/services/paymentGateway";

export class PaystackGateway implements PaymentGateway {
  async createSession(request: PaymentSessionRequest): Promise<PaymentSessionResponse> {
    // Placeholder implementation: Paystack integration to be implemented later.
    // For now, return a mock session id and a redirectUrl placeholder.
    const sessionId = `paystack-${request.orderId}-${Date.now()}`;
    const redirectUrl = env.PAYSTACK_REDIRECT_URL ?? `https://paystack.com/checkout/${sessionId}`;

    return {
      provider: "PAYSTACK",
      sessionId,
      redirectUrl
    };
  }
}

export function verifyPaystackSignature() {
  // Placeholder: actual signature verification will be implemented when integrating Paystack webhooks.
  return true;
}
