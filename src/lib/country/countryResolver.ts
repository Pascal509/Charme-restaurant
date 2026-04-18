import { prisma } from "@/lib/db";
import { i18nConfig } from "@/lib/i18n/config";
import type { PaymentProvider } from "@/features/payment/types";

export type CountryResolutionInput = {
  userCountry?: string;
  billingCountry?: string;
  ipCountry?: string;
  preferredCurrency?: string;
  preferredProvider?: PaymentProvider;
};

export type CountryResolution = {
  countryCode: string;
  defaultCurrency: string;
  currency: string;
  allowedCurrencies: string[];
  allowedProviders: PaymentProvider[];
  fxSpreadBpsOverride?: number | null;
  taxModel: "VAT" | "GST" | "SALES_TAX";
  taxInclusive: boolean;
  taxRateBps: number;
  paymentProviderWeights?: Record<string, number> | null;
  preferredProvider?: PaymentProvider | null;
};
  const countryCode = resolveCountryCode(input);
  const config = await prisma.countryConfig.findUnique({
    where: { countryCode }
  });

  if (!config) {
    throw new Error("Country configuration missing");
  }

  const currency = resolveCurrency(config, input.preferredCurrency);
  const provider = resolveProviderEligibility(config, input.preferredProvider);

  return {
    countryCode: config.countryCode,
    defaultCurrency: config.defaultCurrency,
    currency,
    allowedCurrencies: config.allowedCurrencies,
    allowedProviders: config.allowedPaymentProviders as PaymentProvider[],
    fxSpreadBpsOverride: config.fxSpreadBpsOverride,
    taxModel: config.taxModel,
    taxInclusive: config.taxInclusive,
    taxRateBps: config.taxRateBps,
    paymentProviderWeights: (config.paymentProviderWeights as Record<string, number>) ?? null,
    preferredProvider: provider
  };
}

function resolveCountryCode(input: CountryResolutionInput) {
  const candidates = [input.billingCountry, input.userCountry, input.ipCountry];
  const resolved = candidates.find(Boolean);
  return (resolved ?? i18nConfig.defaultCountry).toLowerCase();
}

function resolveCurrency(
  config: { defaultCurrency: string; allowedCurrencies: string[] },
  preferred?: string
) {
  if (preferred && config.allowedCurrencies.includes(preferred.toUpperCase())) {
    return preferred.toUpperCase();
  }

  return config.defaultCurrency.toUpperCase();
}

function resolveProviderEligibility(
  config: { allowedPaymentProviders: PaymentProvider[] },
  preferred?: PaymentProvider
) {
  if (preferred && config.allowedPaymentProviders.includes(preferred)) {
    return preferred;
  }
  return null;
}
