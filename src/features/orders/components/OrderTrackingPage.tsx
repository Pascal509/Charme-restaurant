"use client";

import { useEffect, useState } from "react";
import Container from "@/components/layout/Container";
import { useOrderRealtime, type OrderRealtimeUpdate } from "@/hooks/useOrderRealtime";
import { t, type DictionaryType } from "@/lib/i18n";

export type OrderItem = {
  id: string;
  quantity: number;
  unitAmountMinor: number;
  currency: string;
  menuItemTitle?: string | null;
  productVariantTitle?: string | null;
};

export type OrderTrackingData = {
  id: string;
  status: string;
  paymentStatus: string;
  orderType: "DELIVERY" | "PICKUP";
  createdAt: string;
  subtotalAmountMinor: number;
  taxAmountMinor: number;
  deliveryFeeAmountMinor: number;
  totalAmountMinor: number;
  displayCurrency: string;
  items: OrderItem[];
  timestamps?: {
    acceptedAt?: string | null;
    preparingAt?: string | null;
    readyAt?: string | null;
    outForDeliveryAt?: string | null;
    deliveredAt?: string | null;
    cancelledAt?: string | null;
  };
};

type TimelineStep = {
  key: string;
  labelKey: string;
  helperKey: string;
};

const TIMELINE: TimelineStep[] = [
  { key: "PLACED", labelKey: "orders.placed", helperKey: "orders.placedHelper" },
  { key: "PREPARING", labelKey: "orders.preparing", helperKey: "orders.preparingHelper" },
  { key: "READY", labelKey: "orders.ready", helperKey: "orders.readyHelper" },
  { key: "OUT_FOR_DELIVERY", labelKey: "orders.onTheWay", helperKey: "orders.onTheWayHelper" },
  { key: "DELIVERED", labelKey: "orders.delivered", helperKey: "orders.deliveredHelper" }
];

const STATUS_ORDER = ["PENDING", "ACCEPTED", "PREPARING", "READY", "OUT_FOR_DELIVERY", "DELIVERED"];

type OrderTrackingPageProps = {
  order: OrderTrackingData;
  dict: DictionaryType;
};

export default function OrderTrackingPage({ order, dict }: OrderTrackingPageProps) {
  const [currentOrder, setCurrentOrder] = useState<OrderTrackingData>(order);
  const { connectionState, lastError, lastEvent } = useOrderRealtime(order.id);

  useEffect(() => {
    if (!lastEvent) return;
    setCurrentOrder((prev) => mergeOrderUpdate(prev, lastEvent));
  }, [lastEvent]);

  const stepIndex = resolveStepIndex(currentOrder.status);
  const deliveryLabel = currentOrder.orderType === "DELIVERY" ? t(dict, "orders.deliveryLabel") : t(dict, "orders.pickupLabel");

  return (
    <main className="bg-brand-rice">
      <Container className="py-10">
        <div className="flex flex-col gap-4">
          <p className="text-xs uppercase tracking-[0.3em] text-brand-ink/60">{t(dict, "orders.tracking")}</p>
          <h1 className="font-display text-3xl text-brand-ink sm:text-4xl">
            {t(dict, "orders.orderPrefix")} {currentOrder.id}
          </h1>
          <div className="flex flex-wrap items-center gap-3 text-sm text-brand-ink/70">
            <StatusBadge status={currentOrder.status} dict={dict} />
            <StatusBadge status={currentOrder.paymentStatus} variant="payment" dict={dict} />
            <span className="rounded-full border border-brand-ink/10 px-3 py-1 text-xs uppercase tracking-[0.2em]">
              {deliveryLabel}
            </span>
          </div>
        </div>
      </Container>

      <section className="border-t border-brand-ink/10">
        <Container className="py-8">
          <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-6">
              <div className="rounded-xl border border-brand-ink/10 bg-white p-6 shadow-soft">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-brand-ink">{t(dict, "orders.timeline")}</h2>
                  <ConnectionChip state={connectionState} dict={dict} />
                </div>

                {lastError ? (
                  <div className="mt-4 rounded-md border border-brand-cinnabar/30 bg-brand-cinnabar/5 px-3 py-2 text-sm text-brand-cinnabar">
                    {lastError}
                  </div>
                ) : null}

                <div className="mt-6 space-y-5">
                  {TIMELINE.map((step, index) => (
                    <TimelineRow
                      key={step.key}
                      step={step}
                      active={index <= stepIndex}
                      current={index === stepIndex}
                      timestamp={resolveTimestamp(step.key, currentOrder)}
                      dict={dict}
                    />
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-brand-ink/10 bg-white p-6 shadow-soft">
                <h2 className="text-lg font-semibold text-brand-ink">{t(dict, "orders.items")}</h2>
                <div className="mt-4 space-y-3">
                  {currentOrder.items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between text-sm">
                      <div>
                        <p className="font-semibold text-brand-ink">
                          {item.menuItemTitle || item.productVariantTitle || t(dict, "orders.itemFallback")}
                        </p>
                        <p className="text-xs text-brand-ink/60">{t(dict, "orders.qty")} {item.quantity}</p>
                      </div>
                      <span className="font-semibold text-brand-ink">
                        {formatCurrency(item.unitAmountMinor * item.quantity, item.currency)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <aside className="space-y-6">
              <div className="rounded-xl border border-brand-ink/10 bg-white p-6 shadow-soft">
                <h2 className="text-lg font-semibold text-brand-ink">{t(dict, "orders.deliveryStatus")}</h2>
                <p className="mt-2 text-sm text-brand-ink/70">
                  {buildDeliveryMessage(currentOrder, dict)}
                </p>
              </div>

              <div className="rounded-xl border border-brand-ink/10 bg-white p-6 shadow-soft">
                <h2 className="text-lg font-semibold text-brand-ink">{t(dict, "orders.totals")}</h2>
                <div className="mt-4 space-y-2 text-sm text-brand-ink/70">
                  <div className="flex items-center justify-between">
                    <span>{t(dict, "orders.subtotal")}</span>
                    <span>{formatCurrency(currentOrder.subtotalAmountMinor, currentOrder.displayCurrency)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>{t(dict, "orders.tax")}</span>
                    <span>{formatCurrency(currentOrder.taxAmountMinor, currentOrder.displayCurrency)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>{t(dict, "orders.deliveryFee")}</span>
                    <span>{formatCurrency(currentOrder.deliveryFeeAmountMinor, currentOrder.displayCurrency)}</span>
                  </div>
                  <div className="flex items-center justify-between border-t border-brand-ink/10 pt-3 text-base font-semibold text-brand-ink">
                    <span>{t(dict, "orders.total")}</span>
                    <span>{formatCurrency(currentOrder.totalAmountMinor, currentOrder.displayCurrency)}</span>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </Container>
      </section>
    </main>
  );
}

function ConnectionChip({ state, dict }: { state: string; dict: DictionaryType }) {
  const label =
    state === "connected"
      ? t(dict, "orders.live")
      : state === "reconnecting"
      ? t(dict, "orders.reconnecting")
      : state === "error"
      ? t(dict, "orders.offline")
      : state === "disconnected"
      ? t(dict, "orders.disconnected")
      : t(dict, "orders.connecting");

  const color =
    state === "connected"
      ? "bg-brand-jade/10 text-brand-jade"
      : state === "error"
      ? "bg-brand-cinnabar/10 text-brand-cinnabar"
      : "bg-brand-ink/10 text-brand-ink/60";

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${color}`}>{label}</span>
  );
}

function StatusBadge({ status, variant, dict }: { status: string; variant?: "payment"; dict: DictionaryType }) {
  const normalized = status.replace(/_/g, " ");
  const label =
    variant === "payment"
      ? `${t(dict, "orders.paymentPrefix")} ${
          status === "PAID"
            ? t(dict, "orders.statusPaid")
            : status === "FAILED"
            ? t(dict, "orders.statusFailed")
            : status === "CANCELLED"
            ? t(dict, "orders.statusCancelled")
            : normalized
        }`
      : normalized;
  const style =
    status === "DELIVERED" || status === "PAID"
      ? "bg-brand-jade/10 text-brand-jade"
      : status === "FAILED" || status === "CANCELLED"
      ? "bg-brand-cinnabar/10 text-brand-cinnabar"
      : "bg-brand-ink/10 text-brand-ink/70";

  return <span className={`rounded-full px-3 py-1 text-xs font-semibold ${style}`}>{label}</span>;
}

function TimelineRow({
  step,
  active,
  current,
  timestamp,
  dict
}: {
  step: TimelineStep;
  active: boolean;
  current: boolean;
  timestamp?: string | null;
  dict: DictionaryType;
}) {
  return (
    <div className="flex items-start gap-4">
      <div className="mt-1 flex flex-col items-center">
        <div
          className={`h-3 w-3 rounded-full ${
            current ? "bg-brand-cinnabar" : active ? "bg-brand-ink" : "bg-brand-ink/20"
          }`}
        />
        <div className={`mt-2 h-10 w-px ${active ? "bg-brand-ink/20" : "bg-brand-ink/10"}`} />
      </div>
      <div>
        <p className={`text-sm font-semibold ${active ? "text-brand-ink" : "text-brand-ink/40"}`}>
          {t(dict, step.labelKey)}
        </p>
        <p className="text-xs text-brand-ink/60">{t(dict, step.helperKey)}</p>
        {timestamp ? <p className="mt-1 text-xs text-brand-ink/50">{formatTime(timestamp)}</p> : null}
      </div>
    </div>
  );
}

function mergeOrderUpdate(order: OrderTrackingData, update: OrderRealtimeUpdate): OrderTrackingData {
  return {
    ...order,
    status: update.status ?? order.status,
    paymentStatus: update.paymentStatus ?? order.paymentStatus,
    timestamps: {
      ...order.timestamps,
      ...update.timestamps
    }
  };
}

function resolveStepIndex(status: string) {
  const idx = STATUS_ORDER.indexOf(status);
  if (idx <= 0) return 0;
  if (status === "ACCEPTED") return 1;
  if (status === "PREPARING") return 1;
  if (status === "READY") return 2;
  if (status === "OUT_FOR_DELIVERY") return 3;
  if (status === "DELIVERED") return 4;
  return Math.min(idx, 4);
}

function resolveTimestamp(stepKey: string, order: OrderTrackingData) {
  if (!order.timestamps) return null;
  if (stepKey === "PREPARING") return order.timestamps.preparingAt ?? order.timestamps.acceptedAt ?? null;
  if (stepKey === "READY") return order.timestamps.readyAt ?? null;
  if (stepKey === "OUT_FOR_DELIVERY") return order.timestamps.outForDeliveryAt ?? null;
  if (stepKey === "DELIVERED") return order.timestamps.deliveredAt ?? null;
  return order.createdAt;
}

function buildDeliveryMessage(order: OrderTrackingData, dict: DictionaryType) {
  if (order.orderType === "PICKUP") {
    if (order.status === "READY") return t(dict, "orders.pickupReady");
    if (order.status === "DELIVERED") return t(dict, "orders.pickupDelivered");
    return t(dict, "orders.pickupWaiting");
  }

  if (order.status === "OUT_FOR_DELIVERY") return t(dict, "orders.deliveryOnWay");
  if (order.status === "DELIVERED") return t(dict, "orders.deliveryDelivered");
  return t(dict, "orders.deliveryWaiting");
}

function formatCurrency(amountMinor: number, currency: string) {
  const formatter = new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency
  });
  return formatter.format(amountMinor / 100);
}

function formatTime(value: string) {
  const date = new Date(value);
  return date.toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" });
}
