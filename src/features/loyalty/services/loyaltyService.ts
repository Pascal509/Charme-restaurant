import { prisma } from "@/lib/db";
import type { Prisma, LoyaltyTier, RewardType } from "@prisma/client";

const DEFAULT_CONFIG_KEY = "default";
const REFERRAL_CODE_LENGTH = 8;

const DEFAULT_CONFIG = {
  key: DEFAULT_CONFIG_KEY,
  earnRateAmountMinor: 100,
  earnRatePoints: 1,
  pointValueMinor: 100,
  expiryDays: 365,
  maxRedemptionPerOrderPoints: 1000,
  bronzeMinSpendMinor: 0,
  silverMinSpendMinor: 100000,
  goldMinSpendMinor: 250000,
  bronzeMinOrders: 0,
  silverMinOrders: 5,
  goldMinOrders: 12,
  bronzeMultiplierBps: 10000,
  silverMultiplierBps: 12000,
  goldMultiplierBps: 15000,
  referralRewardPoints: 200
};

export type LoyaltySummary = {
  accountId: string;
  pointsBalance: number;
  tier: LoyaltyTier;
  lifetimeSpendMinor: number;
  lifetimeOrderCount: number;
  referralCode: string;
  pointsExpiringSoon: number;
  expiryDate: string | null;
};

export async function getLoyaltyConfig(tx?: Prisma.TransactionClient) {
  const client = tx ?? prisma;
  return client.loyaltyConfig.upsert({
    where: { key: DEFAULT_CONFIG_KEY },
    update: {},
    create: DEFAULT_CONFIG
  });
}

export async function updateLoyaltyConfig(params: {
  payload: Partial<typeof DEFAULT_CONFIG>;
}) {
  return prisma.loyaltyConfig.upsert({
    where: { key: DEFAULT_CONFIG_KEY },
    update: params.payload,
    create: { ...DEFAULT_CONFIG, ...params.payload }
  });
}

export async function getLoyaltySummary(userId: string): Promise<LoyaltySummary> {
  return prisma.$transaction(async (tx) => {
    const account = await getOrCreateLoyaltyAccount({ userId, tx });
    await expirePointsForAccount({ accountId: account.id, tx });
    const refreshed = await refreshTier({ accountId: account.id, tx });

    const expiring = await tx.loyaltyTransaction.findFirst({
      where: {
        accountId: account.id,
        type: "EARN",
        expiresAt: { not: null, gt: new Date() },
        pointsRemaining: { gt: 0 }
      },
      orderBy: { expiresAt: "asc" }
    });

    const expiringSoon = await tx.loyaltyTransaction.aggregate({
      where: {
        accountId: account.id,
        type: "EARN",
        expiresAt: expiring?.expiresAt ? { lte: expiring.expiresAt } : undefined,
        pointsRemaining: { gt: 0 }
      },
      _sum: { pointsRemaining: true }
    });

    return {
      accountId: account.id,
      pointsBalance: refreshed.pointsBalance,
      tier: refreshed.tier,
      lifetimeSpendMinor: refreshed.lifetimeSpendMinor,
      lifetimeOrderCount: refreshed.lifetimeOrderCount,
      referralCode: await ensureReferralCode({ userId, tx }),
      pointsExpiringSoon: expiringSoon._sum.pointsRemaining ?? 0,
      expiryDate: expiring?.expiresAt ? expiring.expiresAt.toISOString() : null
    };
  });
}

export async function listAvailableRewards(userId: string) {
  return prisma.$transaction(async (tx) => {
    const account = await getOrCreateLoyaltyAccount({ userId, tx });
    const now = new Date();

    return tx.reward.findMany({
      where: {
        isActive: true,
        AND: [
          { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
          { OR: [{ endsAt: null }, { endsAt: { gte: now } }] },
          { OR: [{ minTier: null }, { minTier: { in: eligibleTiers(account.tier) } }] }
        ]
      },
      orderBy: { costPoints: "asc" }
    });
  });
}

export async function applyReferralCode(params: { userId: string; code: string }) {
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({ where: { id: params.userId } });
    if (!user) throw new Error("User not found");

    const existing = await tx.referral.findUnique({ where: { refereeId: params.userId } });
    if (existing) throw new Error("Referral already applied");

    const referrer = await tx.user.findUnique({
      where: { referralCode: params.code.toUpperCase() }
    });

    if (!referrer || referrer.id === params.userId) {
      throw new Error("Invalid referral code");
    }

    return tx.referral.create({
      data: {
        referrerId: referrer.id,
        refereeId: params.userId,
        code: params.code.toUpperCase()
      }
    });
  });
}

export async function rewardReferralForOrder(params: {
  orderId: string;
  userId: string;
  tx: Prisma.TransactionClient;
}) {
  const referral = await params.tx.referral.findUnique({
    where: { refereeId: params.userId }
  });

  if (!referral || referral.status !== "PENDING") return null;

  const paidCount = await params.tx.order.count({
    where: { userId: params.userId, paymentStatus: "PAID" }
  });

  if (paidCount !== 1) return null;

  const config = await getLoyaltyConfig(params.tx);
  const idempotencyKey = `referral:${referral.id}`;

  const existing = await params.tx.loyaltyTransaction.findUnique({
    where: { idempotencyKey }
  });

  if (existing) return existing;

  const referrerAccount = await getOrCreateLoyaltyAccount({
    userId: referral.referrerId,
    tx: params.tx
  });
  const refereeAccount = await getOrCreateLoyaltyAccount({
    userId: referral.refereeId,
    tx: params.tx
  });

  await params.tx.loyaltyTransaction.createMany({
    data: [
      {
        accountId: referrerAccount.id,
        type: "REFERRAL_BONUS",
        points: config.referralRewardPoints,
        pointsRemaining: config.referralRewardPoints,
        idempotencyKey: `${idempotencyKey}:referrer`,
        metadata: { referralId: referral.id, role: "referrer" }
      },
      {
        accountId: refereeAccount.id,
        type: "REFERRAL_BONUS",
        points: config.referralRewardPoints,
        pointsRemaining: config.referralRewardPoints,
        idempotencyKey: `${idempotencyKey}:referee`,
        metadata: { referralId: referral.id, role: "referee" }
      }
    ]
  });

  await params.tx.loyaltyAccount.update({
    where: { id: referrerAccount.id },
    data: { pointsBalance: { increment: config.referralRewardPoints } }
  });

  await params.tx.loyaltyAccount.update({
    where: { id: refereeAccount.id },
    data: { pointsBalance: { increment: config.referralRewardPoints } }
  });

  await params.tx.referral.update({
    where: { id: referral.id },
    data: { status: "REWARDED", firstOrderId: params.orderId, rewardedAt: new Date() }
  });

  return referral;
}

export async function previewLoyaltyRedemption(params: {
  userId: string;
  pointsToRedeem?: number | null;
  rewardId?: string | null;
  orderSubtotalMinor: number;
  orderTotalMinor: number;
  currency: string;
  cartItems: Array<{ menuItemId: string | null; unitAmountMinor: number; quantity: number }>;
  tx: Prisma.TransactionClient;
}) {
  const config = await getLoyaltyConfig(params.tx);
  const account = await getOrCreateLoyaltyAccount({ userId: params.userId, tx: params.tx });
  await expirePointsForAccount({ accountId: account.id, tx: params.tx });

  if (params.rewardId) {
    const reward = await params.tx.reward.findUnique({ where: { id: params.rewardId } });
    if (!reward || !reward.isActive) throw new Error("Reward unavailable");
    if (account.pointsBalance < reward.costPoints) throw new Error("Insufficient points balance");
    return previewRewardRedemption({
      rewardId: params.rewardId,
      accountTier: account.tier,
      orderSubtotalMinor: params.orderSubtotalMinor,
      orderTotalMinor: params.orderTotalMinor,
      cartItems: params.cartItems,
      tx: params.tx
    });
  }

  if (!params.pointsToRedeem || params.pointsToRedeem <= 0) {
    return { pointsToRedeem: 0, discountMinor: 0 };
  }

  const capByValue = Math.floor(params.orderTotalMinor / config.pointValueMinor);
  const maxPoints = Math.min(
    params.pointsToRedeem,
    account.pointsBalance,
    config.maxRedemptionPerOrderPoints,
    capByValue
  );

  const discountMinor = maxPoints * config.pointValueMinor;

  return { pointsToRedeem: maxPoints, discountMinor };
}

export async function applyLoyaltyRedemption(params: {
  userId: string;
  orderId: string;
  pointsToRedeem?: number | null;
  rewardId?: string | null;
  orderSubtotalMinor: number;
  orderTotalMinor: number;
  currency: string;
  cartItems: Array<{ menuItemId: string | null; unitAmountMinor: number; quantity: number }>;
  idempotencyKey: string;
  tx: Prisma.TransactionClient;
}) {
  const config = await getLoyaltyConfig(params.tx);
  const account = await getOrCreateLoyaltyAccount({ userId: params.userId, tx: params.tx });
  await expirePointsForAccount({ accountId: account.id, tx: params.tx });

  if (params.rewardId) {
    return applyRewardRedemption({
      rewardId: params.rewardId,
      orderId: params.orderId,
      account,
      orderSubtotalMinor: params.orderSubtotalMinor,
      orderTotalMinor: params.orderTotalMinor,
      cartItems: params.cartItems,
      idempotencyKey: params.idempotencyKey,
      tx: params.tx
    });
  }

  if (!params.pointsToRedeem || params.pointsToRedeem <= 0) {
    return { pointsRedeemed: 0, discountMinor: 0 };
  }

  const capByValue = Math.floor(params.orderTotalMinor / config.pointValueMinor);
  const maxPoints = Math.min(
    params.pointsToRedeem,
    account.pointsBalance,
    config.maxRedemptionPerOrderPoints,
    capByValue
  );

  if (maxPoints <= 0) {
    return { pointsRedeemed: 0, discountMinor: 0 };
  }

  const existing = await params.tx.loyaltyTransaction.findUnique({
    where: { idempotencyKey: params.idempotencyKey }
  });

  if (existing) {
    return {
      pointsRedeemed: existing.points,
      discountMinor: existing.amountMinor ?? 0
    };
  }

  await consumeEarnPoints({
    accountId: account.id,
    pointsToConsume: maxPoints,
    tx: params.tx
  });

  await params.tx.loyaltyAccount.update({
    where: { id: account.id },
    data: { pointsBalance: { decrement: maxPoints } }
  });

  await params.tx.loyaltyTransaction.create({
    data: {
      accountId: account.id,
      type: "REDEEM",
      points: maxPoints,
      amountMinor: maxPoints * config.pointValueMinor,
      currency: params.currency,
      orderId: params.orderId,
      idempotencyKey: params.idempotencyKey,
      metadata: { mode: "points" }
    }
  });

  return {
    pointsRedeemed: maxPoints,
    discountMinor: maxPoints * config.pointValueMinor
  };
}

export async function reverseRedemptionForOrder(params: {
  orderId: string;
  tx: Prisma.TransactionClient;
}) {
  const redemption = await params.tx.loyaltyTransaction.findFirst({
    where: { orderId: params.orderId, type: "REDEEM" }
  });

  if (!redemption) return null;

  const idempotencyKey = `order:${params.orderId}:refund`;
  const existing = await params.tx.loyaltyTransaction.findUnique({
    where: { idempotencyKey }
  });

  if (existing) return existing;

  await params.tx.loyaltyAccount.update({
    where: { id: redemption.accountId },
    data: { pointsBalance: { increment: redemption.points } }
  });

  await params.tx.loyaltyTransaction.create({
    data: {
      accountId: redemption.accountId,
      type: "ADJUST",
      points: redemption.points,
      amountMinor: redemption.amountMinor ?? undefined,
      currency: redemption.currency ?? undefined,
      orderId: params.orderId,
      idempotencyKey,
      metadata: { reason: "order_refund" }
    }
  });

  await params.tx.rewardRedemption.updateMany({
    where: { orderId: params.orderId, status: "RESERVED" },
    data: { status: "CANCELLED" }
  });

  return redemption;
}

export async function finalizeRewardRedemption(params: {
  orderId: string;
  tx: Prisma.TransactionClient;
}) {
  await params.tx.rewardRedemption.updateMany({
    where: { orderId: params.orderId, status: "RESERVED" },
    data: { status: "REDEEMED" }
  });
}

export async function awardPointsForOrder(params: {
  orderId: string;
  userId: string;
  tx: Prisma.TransactionClient;
}) {
  const config = await getLoyaltyConfig(params.tx);
  const order = await params.tx.order.findUnique({ where: { id: params.orderId } });
  if (!order) throw new Error("Order not found");

  const idempotencyKey = `order:${order.id}:earn`;
  const existing = await params.tx.loyaltyTransaction.findUnique({
    where: { idempotencyKey }
  });
  if (existing) return existing;

  const account = await getOrCreateLoyaltyAccount({ userId: params.userId, tx: params.tx });

  const baseAmountMinor = Math.max(order.totalAmountMinor - order.loyaltyDiscountMinor, 0);
  const basePoints = Math.floor(baseAmountMinor / config.earnRateAmountMinor) * config.earnRatePoints;
  const multiplierBps = tierMultiplierBps(account.tier, config);
  const points = Math.max(Math.floor((basePoints * multiplierBps) / 10000), 0);

  if (points === 0) return null;

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + config.expiryDays);

  await params.tx.loyaltyTransaction.create({
    data: {
      accountId: account.id,
      type: "EARN",
      points,
      pointsRemaining: points,
      amountMinor: order.totalAmountMinor,
      currency: order.displayCurrency,
      orderId: order.id,
      idempotencyKey,
      expiresAt
    }
  });

  const updated = await params.tx.loyaltyAccount.update({
    where: { id: account.id },
    data: {
      pointsBalance: { increment: points },
      lifetimeSpendMinor: { increment: order.totalAmountMinor },
      lifetimeOrderCount: { increment: 1 }
    }
  });

  await refreshTier({ accountId: updated.id, tx: params.tx });

  return points;
}

async function getOrCreateLoyaltyAccount(params: {
  userId: string;
  tx: Prisma.TransactionClient;
}) {
  await ensureReferralCode({ userId: params.userId, tx: params.tx });
  return params.tx.loyaltyAccount.upsert({
    where: { userId: params.userId },
    update: {},
    create: { userId: params.userId }
  });
}

async function ensureReferralCode(params: { userId: string; tx: Prisma.TransactionClient }) {
  const user = await params.tx.user.findUnique({ where: { id: params.userId } });
  if (!user) throw new Error("User not found");
  if (user.referralCode) return user.referralCode;

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const code = generateReferralCode();
    const existing = await params.tx.user.findUnique({ where: { referralCode: code } });
    if (existing) continue;
    const updated = await params.tx.user.update({
      where: { id: params.userId },
      data: { referralCode: code }
    });
    return updated.referralCode ?? code;
  }

  throw new Error("Unable to generate referral code");
}

async function expirePointsForAccount(params: {
  accountId: string;
  tx: Prisma.TransactionClient;
}) {
  const now = new Date();
  const expiring = await params.tx.loyaltyTransaction.findMany({
    where: {
      accountId: params.accountId,
      type: "EARN",
      expiresAt: { lte: now },
      pointsRemaining: { gt: 0 },
      expiredAt: null
    },
    orderBy: { expiresAt: "asc" }
  });

  if (expiring.length === 0) return 0;

  let totalExpired = 0;

  for (const entry of expiring) {
    const remaining = entry.pointsRemaining ?? 0;
    if (remaining <= 0) continue;

    await params.tx.loyaltyTransaction.update({
      where: { id: entry.id },
      data: { pointsRemaining: 0, expiredAt: now }
    });

    await params.tx.loyaltyTransaction.create({
      data: {
        accountId: params.accountId,
        type: "EXPIRE",
        points: remaining,
        idempotencyKey: `expire:${entry.id}`,
        metadata: { sourceTransactionId: entry.id }
      }
    });

    totalExpired += remaining;
  }

  if (totalExpired > 0) {
    await params.tx.loyaltyAccount.update({
      where: { id: params.accountId },
      data: { pointsBalance: { decrement: totalExpired } }
    });
  }

  return totalExpired;
}

async function consumeEarnPoints(params: {
  accountId: string;
  pointsToConsume: number;
  tx: Prisma.TransactionClient;
}) {
  let remaining = params.pointsToConsume;

  const earnRows = await params.tx.loyaltyTransaction.findMany({
    where: {
      accountId: params.accountId,
      type: "EARN",
      pointsRemaining: { gt: 0 },
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }]
    },
    orderBy: { createdAt: "asc" }
  });

  for (const entry of earnRows) {
    if (remaining <= 0) break;
    const available = entry.pointsRemaining ?? 0;
    const consume = Math.min(available, remaining);

    await params.tx.loyaltyTransaction.update({
      where: { id: entry.id },
      data: { pointsRemaining: available - consume }
    });

    remaining -= consume;
  }

  if (remaining > 0) {
    throw new Error("Insufficient points balance");
  }
}

async function previewRewardRedemption(params: {
  rewardId: string;
  accountTier: LoyaltyTier;
  orderSubtotalMinor: number;
  orderTotalMinor: number;
  cartItems: Array<{ menuItemId: string | null; unitAmountMinor: number; quantity: number }>;
  tx: Prisma.TransactionClient;
}) {
  const reward = await params.tx.reward.findUnique({ where: { id: params.rewardId } });
  if (!reward || !reward.isActive) throw new Error("Reward unavailable");

  const now = new Date();
  if (reward.startsAt && reward.startsAt > now) throw new Error("Reward not active");
  if (reward.endsAt && reward.endsAt < now) throw new Error("Reward expired");

  if (reward.minTier && !eligibleTiers(params.accountTier).includes(reward.minTier)) {
    throw new Error("Reward not available for this tier");
  }

  const discountMinor = resolveRewardDiscount({
    reward,
    orderSubtotalMinor: params.orderSubtotalMinor,
    orderTotalMinor: params.orderTotalMinor,
    cartItems: params.cartItems
  });

  return { reward, discountMinor };
}

async function applyRewardRedemption(params: {
  rewardId: string;
  orderId: string;
  account: { id: string; tier: LoyaltyTier; pointsBalance: number };
  orderSubtotalMinor: number;
  orderTotalMinor: number;
  cartItems: Array<{ menuItemId: string | null; unitAmountMinor: number; quantity: number }>;
  idempotencyKey: string;
  tx: Prisma.TransactionClient;
}) {
  const reward = await params.tx.reward.findUnique({ where: { id: params.rewardId } });
  if (!reward || !reward.isActive) throw new Error("Reward unavailable");

  const now = new Date();
  if (reward.startsAt && reward.startsAt > now) throw new Error("Reward not active");
  if (reward.endsAt && reward.endsAt < now) throw new Error("Reward expired");

  if (reward.minTier && !eligibleTiers(params.account.tier).includes(reward.minTier)) {
    throw new Error("Reward not available for this tier");
  }

  if (params.account.pointsBalance < reward.costPoints) {
    throw new Error("Insufficient points balance");
  }

  const discountMinor = resolveRewardDiscount({
    reward,
    orderSubtotalMinor: params.orderSubtotalMinor,
    orderTotalMinor: params.orderTotalMinor,
    cartItems: params.cartItems
  });

  if (discountMinor <= 0) {
    throw new Error("Reward discount not applicable");
  }

  const existing = await params.tx.loyaltyTransaction.findUnique({
    where: { idempotencyKey: params.idempotencyKey }
  });

  if (existing) {
    return {
      pointsRedeemed: existing.points,
      discountMinor: existing.amountMinor ?? 0
    };
  }

  await consumeEarnPoints({
    accountId: params.account.id,
    pointsToConsume: reward.costPoints,
    tx: params.tx
  });

  await params.tx.loyaltyAccount.update({
    where: { id: params.account.id },
    data: { pointsBalance: { decrement: reward.costPoints } }
  });

  await params.tx.rewardRedemption.create({
    data: {
      rewardId: reward.id,
      accountId: params.account.id,
      orderId: params.orderId,
      status: "RESERVED",
      pointsSpent: reward.costPoints,
      discountAmountMinor: discountMinor
    }
  });

  await params.tx.loyaltyTransaction.create({
    data: {
      accountId: params.account.id,
      type: "REDEEM",
      points: reward.costPoints,
      amountMinor: discountMinor,
      orderId: params.orderId,
      rewardId: reward.id,
      idempotencyKey: params.idempotencyKey,
      metadata: { mode: "reward", rewardType: reward.type }
    }
  });

  return { pointsRedeemed: reward.costPoints, discountMinor };
}

async function refreshTier(params: { accountId: string; tx: Prisma.TransactionClient }) {
  const account = await params.tx.loyaltyAccount.findUnique({
    where: { id: params.accountId }
  });
  if (!account) throw new Error("Loyalty account not found");

  const config = await getLoyaltyConfig(params.tx);
  const nextTier = resolveTier(account, config);

  if (nextTier === account.tier) return account;

  return params.tx.loyaltyAccount.update({
    where: { id: account.id },
    data: { tier: nextTier }
  });
}

function resolveTier(
  account: { lifetimeSpendMinor: number; lifetimeOrderCount: number },
  config: typeof DEFAULT_CONFIG
): LoyaltyTier {
  if (
    account.lifetimeSpendMinor >= config.goldMinSpendMinor ||
    account.lifetimeOrderCount >= config.goldMinOrders
  ) {
    return "GOLD";
  }

  if (
    account.lifetimeSpendMinor >= config.silverMinSpendMinor ||
    account.lifetimeOrderCount >= config.silverMinOrders
  ) {
    return "SILVER";
  }

  return "BRONZE";
}

function tierMultiplierBps(tier: LoyaltyTier, config: typeof DEFAULT_CONFIG) {
  if (tier === "GOLD") return config.goldMultiplierBps;
  if (tier === "SILVER") return config.silverMultiplierBps;
  return config.bronzeMultiplierBps;
}

function resolveRewardDiscount(params: {
  reward: { type: RewardType; valueAmountMinor: number | null; valuePercent: number | null; menuItemId: string | null };
  orderSubtotalMinor: number;
  orderTotalMinor: number;
  cartItems: Array<{ menuItemId: string | null; unitAmountMinor: number; quantity: number }>;
}) {
  switch (params.reward.type) {
    case "DISCOUNT_AMOUNT":
      return Math.min(params.reward.valueAmountMinor ?? 0, params.orderTotalMinor);
    case "DISCOUNT_PERCENT":
      return Math.min(
        Math.round((params.orderSubtotalMinor * (params.reward.valuePercent ?? 0)) / 100),
        params.orderTotalMinor
      );
    case "FREE_ITEM": {
      if (!params.reward.menuItemId) return 0;
      const item = params.cartItems.find((entry) => entry.menuItemId === params.reward.menuItemId);
      if (!item) return 0;
      return Math.min(item.unitAmountMinor, params.orderTotalMinor);
    }
    default:
      return 0;
  }
}

function eligibleTiers(tier: LoyaltyTier) {
  if (tier === "GOLD") return ["BRONZE", "SILVER", "GOLD"] as LoyaltyTier[];
  if (tier === "SILVER") return ["BRONZE", "SILVER"] as LoyaltyTier[];
  return ["BRONZE"] as LoyaltyTier[];
}

function generateReferralCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < REFERRAL_CODE_LENGTH; i += 1) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return code;
}

