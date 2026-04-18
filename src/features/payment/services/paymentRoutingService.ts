import type { PaymentProvider } from "@/features/payment/types";
import { isProviderDisabled } from "@/features/payment/services/providerMetricsService";

export type PaymentRoutingInput = {
  allowedProviders: PaymentProvider[];
  settlementCurrency: string;
  preferredProvider?: PaymentProvider | null;
  weights?: Record<string, number> | null;
  countryCode: string;
};

export async function selectPaymentProvider(input: PaymentRoutingInput) {
  if (input.allowedProviders.length === 0) {
    throw new Error("No payment providers configured");
  }

  const eligible = [] as PaymentProvider[];

  for (const provider of input.allowedProviders) {
    const disabled = await isProviderDisabled({
      provider,
      countryCode: input.countryCode,
      currency: input.settlementCurrency
    });
    if (!disabled) eligible.push(provider);
  }

  if (eligible.length === 0) {
    return input.allowedProviders[0];
  }

  if (input.preferredProvider && eligible.includes(input.preferredProvider)) {
    return input.preferredProvider;
  }

  if (input.weights) {
    const sorted = [...eligible].sort((a, b) => {
      const weightA = input.weights?.[a] ?? 0;
      const weightB = input.weights?.[b] ?? 0;
      return weightB - weightA;
    });

    if (sorted[0]) return sorted[0];
  }

  return eligible[0];
}
