import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import OrderTrackingPage, { type OrderTrackingData } from "@/features/orders/components/OrderTrackingPage";
import { getDictionary, t } from "@/lib/i18n";

export async function generateMetadata({ params }: { params: { locale: string; country: string; id: string } }) {
  const meta = await import("@/lib/seo/metadata");
  const dict = getDictionary(params.locale);
  return meta.buildLocalizedMetadata({
    params: { locale: params.locale, country: params.country },
    title: `Order ${params.id} | Charme Restaurant`,
    description: t(dict, "orders.tracking"),
    pathname: `/${params.locale}/${params.country}/orders/${params.id}`
  });
}

export default async function OrderTrackingRoute({
  params
}: {
  params: { locale: string; country: string; id: string };
}) {
  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: {
      items: {
        include: {
          menuItem: { select: { title: true } },
          productVariant: { select: { title: true } }
        }
      }
    }
  });

  if (!order) {
    notFound();
  }

  const payload: OrderTrackingData = {
    id: order.id,
    status: order.status,
    paymentStatus: order.paymentStatus,
    orderType: order.orderType,
    createdAt: order.createdAt.toISOString(),
    subtotalAmountMinor: order.subtotalAmountMinor,
    taxAmountMinor: order.taxAmountMinor,
    deliveryFeeAmountMinor: order.deliveryFeeAmountMinor,
    totalAmountMinor: order.totalAmountMinor,
    displayCurrency: order.displayCurrency,
    items: order.items.map((item) => ({
      id: item.id,
      quantity: item.quantity,
      unitAmountMinor: item.unitAmountMinor,
      currency: item.currency,
      menuItemTitle: item.menuItem?.title ?? null,
      productVariantTitle: item.productVariant?.title ?? null
    })),
    timestamps: {
      acceptedAt: order.acceptedAt?.toISOString() ?? null,
      preparingAt: order.preparingAt?.toISOString() ?? null,
      readyAt: order.readyAt?.toISOString() ?? null,
      outForDeliveryAt: order.outForDeliveryAt?.toISOString() ?? null,
      deliveredAt: order.deliveredAt?.toISOString() ?? null,
      cancelledAt: order.cancelledAt?.toISOString() ?? null
    }
  };

  return <OrderTrackingPage order={payload} dict={getDictionary(params.locale)} />;
}
