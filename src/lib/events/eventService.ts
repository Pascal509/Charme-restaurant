import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import type { PaymentEventType } from "@/features/payment/types";

export async function emitDomainEvent(params: {
  type: PaymentEventType;
  payload: Record<string, unknown>;
  tx?: Prisma.TransactionClient;
}) {
  const client = params.tx ?? prisma;
  return client.domainEvent.create({
    data: {
      type: params.type,
      payload: JSON.stringify(params.payload),
      status: "PENDING",
      nextRunAt: new Date()
    }
  });
}
