import { prisma } from "@/lib/db";

export type RealtimeRole = "ADMIN" | "STAFF" | "CUSTOMER" | "VENDOR";

export type RealtimeUser = {
  id: string;
  role: RealtimeRole;
};

export type SubscriptionDecision = {
  allowed: boolean;
  reason?: string;
};

export async function canSubscribe(params: {
  user: RealtimeUser;
  channel: string;
}): Promise<SubscriptionDecision> {
  const { user, channel } = params;

  if (user.role === "ADMIN") {
    return { allowed: true };
  }

  if (channel === "kitchen:orders") {
    return allowForRoles(user, ["STAFF"]);
  }

  if (channel === "delivery:orders") {
    return allowForRoles(user, ["STAFF"]);
  }

  if (channel.startsWith("order:")) {
    const orderId = channel.split(":")[1];
    if (!orderId) return { allowed: false, reason: "Missing order id" };
    return canAccessOrder(user, orderId);
  }

  return { allowed: false, reason: "Unknown channel" };
}

async function canAccessOrder(user: RealtimeUser, orderId: string): Promise<SubscriptionDecision> {
  if (user.role === "STAFF") {
    return { allowed: true };
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { userId: true }
  });

  if (!order) return { allowed: false, reason: "Order not found" };

  if (order.userId && order.userId === user.id) {
    return { allowed: true };
  }

  return { allowed: false, reason: "Forbidden" };
}

function allowForRoles(user: RealtimeUser, roles: RealtimeRole[]): SubscriptionDecision {
  if (roles.includes(user.role)) return { allowed: true };
  return { allowed: false, reason: "Forbidden" };
}
