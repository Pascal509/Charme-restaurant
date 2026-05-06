import type { PaymentGateway } from "@/features/payment/services/paymentGateway";
import type { PaymentProvider } from "@/features/payment/types";
import { FlutterwaveGateway } from "@/features/payment/services/providers/flutterwaveGateway";
import { PaystackGateway } from "@/features/payment/services/providers/paystackGateway";

const gateways: Record<PaymentProvider, PaymentGateway> = {
  FLUTTERWAVE: new FlutterwaveGateway(),
  PAYSTACK: new PaystackGateway()
};

export function getPaymentGateway(provider: PaymentProvider) {
  return gateways[provider];
}
