import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import { failOrder } from "@/features/orders/services/orderService";
import { emitDomainEvent } from "@/lib/events/eventService";
import { recordWebhookEvent } from "@/features/payment/services/webhookEventService";
import { log } from "@/lib/logger";
import type { PaymentProvider } from "@/features/payment/types";
import { getPaymentGateway } from "@/features/payment/services/gatewayFactory";
import {
  awardPointsForOrder,
  finalizeRewardRedemption,
  reverseRedemptionForOrder,
  rewardReferralForOrder
} from "@/features/loyalty/services/loyaltyService";

export type PaymentSession = {
  id: string;
  provider: PaymentProvider;
  status: "PENDING" | "READY";
  redirectUrl?: string;
};

export async function createPaymentSession(params: {
  orderId: string;
  amountMinor: number;
  currency: string;
  provider: PaymentProvider;
  idempotencyKeyId?: string;
  tx?: Prisma.TransactionClient;
}) {
  const client = params.tx ?? prisma;
  const payment = await client.payment.create({
    data: {
      orderId: params.orderId,
      provider: params.provider,
      amountMinor: params.amountMinor,
      currency: params.currency,
      status: "PENDING",
      idempotencyKeyId: params.idempotencyKeyId
    }
  });

  return {
    id: payment.id,
    provider: payment.provider,
    status: "PENDING"
  } as PaymentSession;
}

export async function initiateProviderPayment(params: {
  orderId: string;
  provider: PaymentProvider;
}) {
  const order = await prisma.order.findUnique({ where: { id: params.orderId } });
  if (!order) throw new Error("Order not found");

  const payment = await prisma.payment.findFirst({
    where: { orderId: order.id, provider: params.provider }
  });

  if (payment?.providerPaymentId) {
    log("info", "Payment session already exists", {
      orderId: order.id,
      provider: params.provider,
      providerPaymentId: payment.providerPaymentId
    });
    return {
      provider: params.provider,
      sessionId: payment.providerPaymentId
    };
  }

  const gateway = getPaymentGateway(params.provider);
  const settlementAmountMinor = payment?.amountMinor ?? resolveSettlementAmount(order);
  const settlementCurrency = payment?.currency ?? order.settlementCurrency;
  const session = await gateway.createSession({
    orderId: order.id,
    amountMinor: settlementAmountMinor,
    currency: settlementCurrency
  });

  log("info", "Payment session created", {
    orderId: order.id,
    provider: params.provider,
    providerPaymentId: session.sessionId,
    amountMinor: settlementAmountMinor,
    currency: settlementCurrency
  });

  if (payment) {
    await prisma.payment.update({
      where: { id: payment.id },
      data: { providerPaymentId: session.sessionId, reference: order.id }
    });
  } else {
    await prisma.payment.create({
      data: {
        orderId: order.id,
        provider: params.provider,
        amountMinor: settlementAmountMinor,
        currency: settlementCurrency,
        status: "PENDING",
        providerPaymentId: session.sessionId,
        reference: order.id
      }
    });
  }

  return session;
}

function resolveSettlementAmount(order: {
  totalAmountMinor: number;
  displayCurrency: string;
  settlementCurrency: string;
  fxRateUsed: Prisma.Decimal | null;
}) {
  if (order.displayCurrency === order.settlementCurrency) {
    return order.totalAmountMinor;
  }

  if (!order.fxRateUsed) {
    throw new Error("Missing FX rate for settlement");
  }

  const rate = Number(order.fxRateUsed);
  return Math.round(order.totalAmountMinor / rate);
}

export async function updatePaymentFromWebhook(params: {
  provider: PaymentProvider;
  eventId: string;
  providerPaymentId: string;
  reference?: string | null;
  status: "PAID" | "FAILED" | "PENDING";
  amountMinor: number;
  currency: string;
  payload: string;
}) {
  const { provider, eventId, providerPaymentId, reference, status, amountMinor, currency, payload } = params;

  return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const recorded = await recordWebhookEvent({ provider, eventId, payload, tx });
    if (recorded && recorded.status === "PROCESSED") {
      log("info", "Duplicate webhook ignored", {
        provider,
        eventId,
        providerPaymentId
      });
      return { status: "DUPLICATE" };
    }

    let payment = await tx.payment.findFirst({
      where: { provider, providerPaymentId }
    });

    if (!payment && reference) {
      payment = await tx.payment.findFirst({ where: { provider, reference } });
    }

    if (!payment) {
      payment = await tx.payment.findFirst({ where: { provider, reference: providerPaymentId } });
    }

    if (!payment) {
      log("warn", "Payment not found for webhook", {
        provider,
        eventId,
        providerPaymentId
      });
      return { status: "PAYMENT_NOT_FOUND" };
    }

    const order = await tx.order.findUnique({ where: { id: payment.orderId } });
    if (!order) {
      log("warn", "Order not found for webhook", {
        provider,
        eventId,
        providerPaymentId,
        paymentId: payment.id
      });
      return { status: "ORDER_NOT_FOUND" };
    }

    if (payment.amountMinor !== amountMinor || payment.currency !== currency.toUpperCase()) {
      log("warn", "Payment amount mismatch", {
        provider,
        eventId,
        paymentId: payment.id,
        expectedAmountMinor: payment.amountMinor,
        receivedAmountMinor: amountMinor,
        expectedCurrency: payment.currency,
        receivedCurrency: currency
      });
      await tx.webhookEvent.update({
        where: { provider_eventId: { provider, eventId } },
        data: { status: "AMOUNT_MISMATCH", processedAt: new Date() }
      });
      return { status: "AMOUNT_MISMATCH" };
    }

    if (status === "PAID") {
      log("info", "Payment confirmed", {
        provider,
        eventId,
        orderId: order.id,
        paymentId: payment.id
      });
      await tx.payment.update({
        where: { id: payment.id },
        data: { status: "PAID" }
      });

      await tx.order.update({
        where: { id: order.id },
        data: { paymentStatus: "PAID" }
      });

      await emitDomainEvent({
        type: "PaymentConfirmed",
        payload: { orderId: order.id, paymentId: payment.id },
        tx
      });

      if (order.userId) {
        await finalizeRewardRedemption({ orderId: order.id, tx });
        await awardPointsForOrder({ orderId: order.id, userId: order.userId, tx });
        await rewardReferralForOrder({ orderId: order.id, userId: order.userId, tx });
      }

    } else if (status === "FAILED") {
      log("warn", "Payment failed", {
        provider,
        eventId,
        orderId: order.id,
        paymentId: payment.id
      });
      await tx.payment.update({
        where: { id: payment.id },
        data: { status: "FAILED" }
      });

      await failOrder(order.id, tx);
      await reverseRedemptionForOrder({ orderId: order.id, tx });

      await emitDomainEvent({
        type: "PaymentFailed",
        payload: { orderId: order.id, paymentId: payment.id },
        tx
      });
    }

    await tx.webhookEvent.update({
      where: { provider_eventId: { provider, eventId } },
      data: { status: "PROCESSED", processedAt: new Date() }
    });

    log("info", "Webhook processed", {
      provider,
      eventId,
      orderId: order.id,
      status
    });

    return { status: "OK" };
  });
}
