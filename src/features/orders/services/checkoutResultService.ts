import { prisma } from "@/lib/db";

export type CheckoutResultOrderSummary = {
  id: string;
  status: string;
  paymentStatus: string;
  displayCurrency: string;
  subtotalAmountMinor: number;
  taxAmountMinor: number;
  deliveryFeeAmountMinor: number;
  totalAmountMinor: number;
  createdAt: Date;
  items: Array<{
    id: string;
    quantity: number;
    unitAmountMinor: number;
    currency: string;
    displayName: string;
    lineTotalMinor: number;
  }>;
};

export async function getCheckoutResultOrderSummary(orderId?: string | null): Promise<CheckoutResultOrderSummary | null> {
  if (!orderId) {
    return null;
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      status: true,
      paymentStatus: true,
      displayCurrency: true,
      subtotalAmountMinor: true,
      taxAmountMinor: true,
      deliveryFeeAmountMinor: true,
      totalAmountMinor: true,
      createdAt: true,
      items: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          quantity: true,
          unitAmountMinor: true,
          currency: true,
          menuItem: { select: { title: true } },
          productVariant: { select: { title: true } }
        }
      }
    }
  });

  if (!order) {
    return null;
  }

  return {
    id: order.id,
    status: order.status,
    paymentStatus: order.paymentStatus,
    displayCurrency: order.displayCurrency,
    subtotalAmountMinor: order.subtotalAmountMinor,
    taxAmountMinor: order.taxAmountMinor,
    deliveryFeeAmountMinor: order.deliveryFeeAmountMinor,
    totalAmountMinor: order.totalAmountMinor,
    createdAt: order.createdAt,
    items: order.items.map((item) => {
      const displayName = item.menuItem?.title ?? item.productVariant?.title ?? "Order item";

      return {
        id: item.id,
        quantity: item.quantity,
        unitAmountMinor: item.unitAmountMinor,
        currency: item.currency,
        displayName,
        lineTotalMinor: item.unitAmountMinor * item.quantity
      };
    })
  };
}