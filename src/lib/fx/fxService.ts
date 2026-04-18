import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { Money } from "@/lib/money";

type FxCacheEntry = {
  rate: number;
  updatedAt: Date;
};

const fxCache = new Map<string, FxCacheEntry>();

export async function getFxRate(quoteCurrency: string) {
  const baseCurrency = env.BASE_CURRENCY.toUpperCase();
  const quote = quoteCurrency.toUpperCase();

  if (baseCurrency === quote) {
    return 1;
  }

  const cacheKey = `${baseCurrency}:${quote}`;
  const cached = fxCache.get(cacheKey);
  const ttlMs = env.FX_RATE_TTL_SECONDS * 1000;

  if (cached && Date.now() - cached.updatedAt.getTime() < ttlMs) {
    return cached.rate;
  }

  const record = await prisma.fxRate.findUnique({
    where: { baseCurrency_quoteCurrency: { baseCurrency, quoteCurrency: quote } }
  });

  if (!record) {
    throw new Error("FX rate not configured");
  }

  fxCache.set(cacheKey, { rate: Number(record.rate), updatedAt: record.updatedAt });
  return Number(record.rate);
}

export async function convertFromBase(
  money: Money,
  targetCurrency: string,
  spreadBpsOverride?: number
) {
  const baseCurrency = env.BASE_CURRENCY.toUpperCase();
  if (money.currency !== baseCurrency) {
    throw new Error("Base currency mismatch");
  }

  const rate = await getFxRate(targetCurrency);
  const spreadBps = spreadBpsOverride ?? env.FX_SPREAD_BPS;
  const spread = 1 + spreadBps / 10000;
  const adjustedRate = rate * spread;
  const targetMinor = Math.round(money.amountMinor * adjustedRate);

  return {
    money: new Money(targetMinor, targetCurrency),
    rate: adjustedRate
  };
}

export async function convertToBase(money: Money, spreadBpsOverride?: number) {
  const baseCurrency = env.BASE_CURRENCY.toUpperCase();
  if (money.currency === baseCurrency) {
    return { money, rate: 1 };
  }

  const rate = await getFxRate(money.currency);
  const spreadBps = spreadBpsOverride ?? env.FX_SPREAD_BPS;
  const spread = 1 + spreadBps / 10000;
  const adjustedRate = rate * spread;
  const baseMinor = Math.round(money.amountMinor / adjustedRate);

  return {
    money: new Money(baseMinor, baseCurrency),
    rate: adjustedRate
  };
}

export async function upsertFxRate(params: {
  quoteCurrency: string;
  rate: number;
}) {
  const baseCurrency = env.BASE_CURRENCY.toUpperCase();
  const quote = params.quoteCurrency.toUpperCase();

  await prisma.fxRate.upsert({
    where: { baseCurrency_quoteCurrency: { baseCurrency, quoteCurrency: quote } },
    update: { rate: params.rate, updatedAt: new Date() },
    create: { baseCurrency, quoteCurrency: quote, rate: params.rate }
  });

  fxCache.set(`${baseCurrency}:${quote}`, {
    rate: params.rate,
    updatedAt: new Date()
  });
}
