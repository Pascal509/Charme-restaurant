import { env } from "@/lib/env";
import type { PaymentProvider } from "@/features/payment/types";

const PAYMENT_PROVIDERS: PaymentProvider[] = ["FLUTTERWAVE", "PAYSTACK"];

export function getDefaultPaymentProvider(): PaymentProvider {
  return env.DEFAULT_PAYMENT_PROVIDER;
}

export function getAvailablePaymentProviders(): PaymentProvider[] {
  const preferred = getDefaultPaymentProvider();
  return [preferred, ...PAYMENT_PROVIDERS.filter((provider) => provider !== preferred)];
}
