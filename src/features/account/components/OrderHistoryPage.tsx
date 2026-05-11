"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import Container from "@/components/layout/Container";
import SectionHero from "@/components/sections/SectionHero";
import { images } from "@/config/images";
import { useCartStore } from "@/store/useCartStore";
import { getDictionary, t } from "@/lib/i18n";

type OrderItem = {
  id: string;
  quantity: number;
  unitAmountMinor: number;
  currency: string;
  menuItemId?: string | null;
  productVariantId?: string | null;
  menuItem?: { title: string } | null;
  productVariant?: { title: string | null } | null;
};

type OrderSummary = {
  id: string;
  status: string;
  paymentStatus: string;
  orderType: "DELIVERY" | "PICKUP";
  displayCurrency: string;
  subtotalAmountMinor: number;
  taxAmountMinor: number;
  deliveryFeeAmountMinor: number;
  totalAmountMinor: number;
  createdAt: string;
  items: OrderItem[];
};

type OrdersResponse = {
  orders: OrderSummary[];
};

const CART_ADD_ENDPOINT = "/api/cart/add";

export default function OrderHistoryPage({
  locale,
  country
}: {
  locale: string;
  country: string;
}) {
  const [guestId, setGuestId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [reorderingId, setReorderingId] = useState<string | null>(null);
  const { incrementBy } = useCartStore();
  const dict = getDictionary(locale);

  useEffect(() => {    const id = resolveGuestId();
    if (id) setGuestId(id);
  }, []);

  const ordersQuery = useQuery<OrdersResponse>({
    queryKey: ["orders"],
    queryFn: async () => {
      const response = await fetch("/api/orders");
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || t(dict, "account.ordersError"));
      }
      return response.json();
    },
    staleTime: 30 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false
  });

  const orders = ordersQuery.data?.orders ?? [];
  const basePath = `/${locale}/${country}`;

  async function handleReorder(order: OrderSummary) {
    setErrorMessage(null);
    setReorderingId(order.id);

    if (!guestId) {
      setErrorMessage(t(dict, "account.guestCartUnavailable"));
      setReorderingId(null);
      return;
    }

    try {
      for (const item of order.items) {
        const payload = {
          guestId,
          menuItemId: item.menuItemId ?? undefined,
          productVariantId: item.productVariantId ?? undefined,
          quantity: item.quantity,
          selectedOptions: []
        } as {
          guestId: string;
          menuItemId?: string;
          productVariantId?: string;
          quantity: number;
          selectedOptions: string[];
        };

        if (!payload.menuItemId && !payload.productVariantId) continue;

        const response = await fetch(CART_ADD_ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          const error = await response.json().catch(() => ({}));
          throw new Error(error.error || t(dict, "account.reorderError"));
        }
      }

      const count = order.items.reduce((sum, item) => sum + item.quantity, 0);
      incrementBy(count);
      window.location.href = `${basePath}/cart`;
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : t(dict, "account.reorderError"));
    } finally {
      setReorderingId(null);
    }
  }

  return (
    <main className="bg-brand-rice page-transition">
      <Container className="py-10">
        <SectionHero
          eyebrow={t(dict, "account.eyebrow")}
          title={t(dict, "account.orderHistory")}
          subtitle={t(dict, "account.subtitle")}
          imageUrl={images.dining}
        />
      </Container>

      <section className="border-t border-brand-ink/10">
        <Container className="py-8">
          {errorMessage ? (
            <div className="mb-6 rounded-md border border-brand-cinnabar/30 bg-brand-cinnabar/5 px-3 py-2 text-sm text-brand-cinnabar">
              {errorMessage}
            </div>
          ) : null}

          {ordersQuery.isLoading ? (
            <OrderSkeleton />
          ) : ordersQuery.isError ? (
            <div className="rounded-lg border border-brand-ink/10 bg-white p-6 text-sm text-brand-ink/70">
              {t(dict, "account.ordersError")}
            </div>
          ) : orders.length === 0 ? (
            <div className="rounded-lg border border-brand-ink/10 bg-white p-6 text-sm text-brand-ink/70">
              {t(dict, "account.noOrders")}
            </div>
          ) : (
            <div className="space-y-6">
              {orders.map((order) => (
                <div key={order.id} className="rounded-xl border border-brand-ink/10 bg-white p-5 shadow-soft">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-brand-ink/60">{t(dict, "orders.orderPrefix")}</p>
                      <div className="mt-2 flex items-center gap-3">
                        <h2 className="text-lg font-semibold text-brand-ink">{order.id}</h2>
                        <StatusBadge status={order.status} dict={dict} />
                      </div>
                      <p className="mt-1 text-xs text-brand-ink/60">
                        {formatDate(order.createdAt)} · {order.orderType === "DELIVERY" ? t(dict, "orders.deliveryLabel") : t(dict, "orders.pickupLabel")}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-brand-ink/60">{t(dict, "orders.total")}</p>
                      <p className="text-lg font-semibold text-brand-ink">
                        {formatCurrency(order.totalAmountMinor, order.displayCurrency)}
                      </p>
                      <Link
                        href={`${basePath}/orders/${order.id}`}
                        className="mt-2 inline-flex text-xs font-semibold text-brand-ink"
                      >
                        {t(dict, "account.track")}
                      </Link>
                    </div>
                  </div>

                  <div className="mt-4 space-y-3 text-sm">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-brand-ink">
                            {item.menuItem?.title || item.productVariant?.title || t(dict, "orders.itemFallback")}
                          </p>
                          <p className="text-xs text-brand-ink/60">{t(dict, "orders.qty")} {item.quantity}</p>
                        </div>
                        <span className="font-semibold text-brand-ink">
                          {formatCurrency(item.unitAmountMinor * item.quantity, item.currency)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-brand-ink/10 pt-4">
                    <div className="text-xs text-brand-ink/60">
                      {t(dict, "orders.paymentPrefix")} {order.paymentStatus === "PAID" ? t(dict, "orders.statusPaid") : order.paymentStatus === "FAILED" ? t(dict, "orders.statusFailed") : order.paymentStatus === "CANCELLED" ? t(dict, "orders.statusCancelled") : order.paymentStatus.replace(/_/g, " ")}
                    </div>
                    <button
                      onClick={() => handleReorder(order)}
                      disabled={reorderingId === order.id}
                      className="rounded-md bg-brand-cinnabar px-4 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:bg-brand-cinnabar/60"
                    >
                      {reorderingId === order.id ? t(dict, "account.reordering") : t(dict, "account.reorder")}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Container>
      </section>
    </main>
  );
}

function StatusBadge({ status, dict }: { status: string; dict: ReturnType<typeof getDictionary> }) {
  const label =
    status === "DELIVERED"
      ? t(dict, "orders.delivered")
      : status === "CANCELLED"
      ? t(dict, "orders.statusCancelled")
      : status === "FAILED"
      ? t(dict, "orders.statusFailed")
      : status.replace(/_/g, " ");
  const style =
    status === "DELIVERED"
      ? "bg-brand-jade/10 text-brand-jade"
      : status === "CANCELLED" || status === "FAILED"
      ? "bg-brand-cinnabar/10 text-brand-cinnabar"
      : "bg-brand-ink/10 text-brand-ink/70";

  return <span className={`rounded-full px-2 py-1 text-xs font-semibold ${style}`}>{label}</span>;
}

function OrderSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="h-40 rounded-lg bg-brand-ink/10 skeleton" />
      ))}
    </div>
  );
}

function formatCurrency(amountMinor: number, currency: string) {
  const formatter = new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency
  });
  return formatter.format(amountMinor / 100);
}

function formatDate(value: string) {
  const date = new Date(value);
  return date.toLocaleDateString("en-NG", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

function resolveGuestId() {
  if (typeof window === "undefined") return null;

  const stored = window.localStorage.getItem("guestId");
  if (stored) return stored;

  const nextId = typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `guest_${Date.now()}_${Math.random().toString(16).slice(2)}`;

  window.localStorage.setItem("guestId", nextId);
  return nextId;
}
