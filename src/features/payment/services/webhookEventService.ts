import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import type { PaymentProvider } from "@/features/payment/types";

export async function recordWebhookEvent(params: {
  provider: PaymentProvider;
  eventId: string;
  payload: string;
  tx?: Prisma.TransactionClient;
}) {
  const client = params.tx ?? prisma;
  const existing = await client.webhookEvent.findUnique({
    where: { provider_eventId: { provider: params.provider, eventId: params.eventId } }
  });
  if (existing) return existing;

  return client.webhookEvent.create({
    data: {
      provider: params.provider,
      eventId: params.eventId,
      payload: params.payload
    }
  });
}
