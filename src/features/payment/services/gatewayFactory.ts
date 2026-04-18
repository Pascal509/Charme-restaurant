import type { PaymentGateway } from "@/features/payment/services/paymentGateway";
import type { PaymentProvider } from "@/features/payment/types";
import { StripeGateway } from "@/features/payment/services/providers/stripeGateway";
import { FlutterwaveGateway } from "@/features/payment/services/providers/flutterwaveGateway";

const gateways: Record<PaymentProvider, PaymentGateway> = {
  STRIPE: new StripeGateway(),
  FLUTTERWAVE: new FlutterwaveGateway()
};

export function getPaymentGateway(provider: PaymentProvider) {
  return gateways[provider];
}
