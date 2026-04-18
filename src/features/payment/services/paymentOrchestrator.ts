import type { PaymentProvider } from "@/features/payment/types";
import { selectPaymentProvider } from "@/features/payment/services/paymentRoutingService";
import { initiateProviderPayment } from "@/features/payment/services/paymentService";
import { recordPaymentAttempt, isProviderDisabled } from "@/features/payment/services/providerMetricsService";
import { prisma } from "@/lib/db";
import { log } from "@/lib/logger";

const MAX_FALLBACKS = 2;

export async function createPaymentSessionWithFallback(params: {
  orderId: string;
  countryCode: string;
  settlementCurrency: string;
  allowedProviders: PaymentProvider[];
  preferredProvider?: PaymentProvider | null;
  weights?: Record<string, number> | null;
}) {
  const primary = await selectPaymentProvider({
    allowedProviders: params.allowedProviders,
    settlementCurrency: params.settlementCurrency,
    preferredProvider: params.preferredProvider,
    weights: params.weights,
    countryCode: params.countryCode
  });

  log("info", "Selected payment provider", {
    orderId: params.orderId,
    provider: primary,
    allowedProviders: params.allowedProviders,
    currency: params.settlementCurrency
  });

  const candidates = [primary, ...params.allowedProviders.filter((p) => p !== primary)];
  const limited = candidates.slice(0, MAX_FALLBACKS + 1);

  let lastError: Error | null = null;

  for (const provider of limited) {
    const disabled = await isProviderDisabled({
      provider,
      countryCode: params.countryCode,
      currency: params.settlementCurrency
    });
    if (disabled) {
      log("warn", "Payment provider disabled", {
        orderId: params.orderId,
        provider,
        countryCode: params.countryCode,
        currency: params.settlementCurrency
      });
    }
    if (disabled) continue;

    const start = Date.now();

    try {
      const session = await initiateProviderPayment({
        orderId: params.orderId,
        provider
      });

      const payment = await prisma.payment.findFirst({
        where: { orderId: params.orderId, provider }
      });

      await recordPaymentAttempt({
        orderId: params.orderId,
        paymentId: payment?.id,
        provider,
        countryCode: params.countryCode,
        currency: params.settlementCurrency,
        status: "SUCCESS",
        latencyMs: Date.now() - start,
        retryable: false
      });

      return { session, provider };
    } catch (error) {
      const retryable = isRetryableError(error);
      log("warn", "Payment provider failed", {
        orderId: params.orderId,
        provider,
        retryable,
        error: error instanceof Error ? error.message : "Unknown error"
      });
      await recordPaymentAttempt({
        orderId: params.orderId,
        paymentId: null,
        provider,
        countryCode: params.countryCode,
        currency: params.settlementCurrency,
        status: "FAILED",
        latencyMs: Date.now() - start,
        failureReason: error instanceof Error ? error.message : "Unknown error",
        retryable
      });

      lastError = error instanceof Error ? error : new Error("Unknown error");
      if (!retryable) break;
    }
  }

  throw lastError ?? new Error("Payment provider unavailable");
}

function isRetryableError(error: unknown) {
  if (!(error instanceof Error)) return true;
  const message = error.message.toLowerCase();
  if (message.includes("order not found")) return false;
  if (message.includes("missing fx rate")) return false;
  return true;
}
