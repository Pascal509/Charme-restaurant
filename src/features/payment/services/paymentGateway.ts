export type PaymentProvider = "FLUTTERWAVE" | "PAYSTACK";

export type PaymentSessionRequest = {
  orderId: string;
  amountMinor: number;
  currency: string;
  callbackUrl?: string;
};

export type PaymentSessionResponse = {
  provider: PaymentProvider;
  sessionId: string;
  redirectUrl?: string;
};

export interface PaymentGateway {
  createSession(request: PaymentSessionRequest): Promise<PaymentSessionResponse>;
}
