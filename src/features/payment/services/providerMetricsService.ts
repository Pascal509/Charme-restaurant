import { Decimal } from "@prisma/client/runtime/library";
import { prisma } from "@/lib/db";
import type { PaymentProvider } from "@/features/payment/types";

const FAILURE_RATE_THRESHOLD = 0.4;
const MIN_ATTEMPTS = 10;
const COOLDOWN_MINUTES = 15;

export async function getProviderMetric(params: {
  provider: PaymentProvider;
  countryCode: string;
  currency: string;
}) {
  return prisma.providerMetric.findUnique({
    where: {
      provider_countryCode_currency: {
        provider: params.provider,
        countryCode: params.countryCode,
        currency: params.currency
      }
    }
  });
}

export async function recordPaymentAttempt(params: {
  orderId: string;
  paymentId?: string | null;
  provider: PaymentProvider;
  countryCode: string;
  currency: string;
  status: "SUCCESS" | "FAILED";
  latencyMs: number;
  failureReason?: string | null;
  retryable: boolean;
}) {
  const { provider, countryCode, currency } = params;

  const attempt = await prisma.paymentAttempt.create({
    data: {
      orderId: params.orderId,
      paymentId: params.paymentId ?? undefined,
      provider,
      countryCode,
      currency,
      status: params.status,
      latencyMs: params.latencyMs,
      failureReason: params.failureReason ?? undefined,
      retryable: params.retryable
    }
  });

  const metric = await prisma.providerMetric.findUnique({
    where: {
      provider_countryCode_currency: {
        provider,
        countryCode,
        currency
      }
    }
  });

  const totalAttempts = (metric?.totalAttempts ?? 0) + 1;
  const totalFailures = (metric?.totalFailures ?? 0) + (params.status === "FAILED" ? 1 : 0);
  const totalSuccess = (metric?.totalSuccess ?? 0) + (params.status === "SUCCESS" ? 1 : 0);
  const failureRate = totalAttempts === 0 ? 0 : totalFailures / totalAttempts;
  const avgLatencyMs = Math.round(
    ((metric?.avgLatencyMs ?? 0) * (totalAttempts - 1) + params.latencyMs) / totalAttempts
  );

  let disabledUntil = metric?.disabledUntil ?? null;

  if (totalAttempts >= MIN_ATTEMPTS && failureRate >= FAILURE_RATE_THRESHOLD) {
    const cooldown = new Date();
    cooldown.setMinutes(cooldown.getMinutes() + COOLDOWN_MINUTES);
    disabledUntil = cooldown;
  }

  await prisma.providerMetric.upsert({
    where: {
      provider_countryCode_currency: {
        provider,
        countryCode,
        currency
      }
    },
    update: {
      totalAttempts,
      totalFailures,
      totalSuccess,
      failureRate: new Decimal(failureRate),
      avgLatencyMs,
      lastFailureAt: params.status === "FAILED" ? new Date() : metric?.lastFailureAt ?? null,
      disabledUntil
    },
    create: {
      provider,
      countryCode,
      currency,
      totalAttempts,
      totalFailures,
      totalSuccess,
      failureRate: new Decimal(failureRate),
      avgLatencyMs,
      lastFailureAt: params.status === "FAILED" ? new Date() : null,
      disabledUntil
    }
  });

  return attempt;
}

export async function isProviderDisabled(params: {
  provider: PaymentProvider;
  countryCode: string;
  currency: string;
}) {
  const metric = await getProviderMetric(params);
  if (!metric?.disabledUntil) return false;

  if (metric.disabledUntil <= new Date()) {
    await prisma.providerMetric.update({
      where: {
        provider_countryCode_currency: {
          provider: params.provider,
          countryCode: params.countryCode,
          currency: params.currency
        }
      },
      data: { disabledUntil: null }
    });
    return false;
  }

  return true;
}
