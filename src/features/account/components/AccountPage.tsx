"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import Container from "@/components/layout/Container";
import { useCartStore } from "@/store/useCartStore";
import AddressManager from "@/features/addresses/components/AddressManager";

type OrderSummary = {
  id: string;
  status: string;
  paymentStatus: string;
  orderType: "DELIVERY" | "PICKUP";
  displayCurrency: string;
  totalAmountMinor: number;
  createdAt: string;
};

type OrdersResponse = {
  orders: OrderSummary[];
};

export default function AccountPage({
  locale,
  country
}: {
  locale: string;
  country: string;
}) {
  const { data: session, status } = useSession();
  const [mergeError, setMergeError] = useState<string | null>(null);
  const { setItemCount } = useCartStore();

  const ordersQuery = useQuery<OrdersResponse>({
    queryKey: ["orders"],
    enabled: status === "authenticated",
    queryFn: async () => {
      const response = await fetch("/api/orders");
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || "Failed to load orders");
      }
      return response.json();
    }
  });

  useEffect(() => {
    if (status !== "authenticated") return;
    mergeGuestCart(setItemCount).catch((error) => {
      setMergeError(error instanceof Error ? error.message : "Failed to merge cart");
    });
  }, [status, setItemCount]);

  const basePath = `/${locale}/${country}`;
  const user = session?.user ?? null;
  const orders = ordersQuery.data?.orders ?? [];

  const hasOrders = orders.length > 0;
  const latestOrder = useMemo(() => orders[0] ?? null, [orders]);

  return (
    <main className="bg-brand-rice">
      <Container className="py-10">
        <div className="flex flex-col gap-4">
          <p className="text-xs uppercase tracking-[0.3em] text-brand-ink/60">Account</p>
          <h1 className="font-display text-3xl text-brand-ink sm:text-4xl">Welcome back</h1>
          <p className="max-w-2xl text-sm text-brand-ink/70">
            Manage your details, review past orders, and keep delivery information close.
          </p>
        </div>
      </Container>

      <section className="border-t border-brand-ink/10">
        <Container className="py-8">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="space-y-6">
              <div className="rounded-xl border border-brand-ink/10 bg-white p-6 shadow-soft">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-brand-ink">Profile</h2>
                  <button
                    onClick={() => signOut({ callbackUrl: basePath })}
                    className="text-xs font-semibold text-brand-cinnabar"
                  >
                    Log out
                  </button>
                </div>

                {status === "loading" ? (
                  <div className="mt-4 space-y-2 text-sm text-brand-ink/60">
                    <div className="h-4 w-40 rounded-full bg-brand-ink/10" />
                    <div className="h-4 w-56 rounded-full bg-brand-ink/10" />
                  </div>
                ) : (
                  <div className="mt-4 space-y-2 text-sm text-brand-ink/70">
                    <p className="text-base font-semibold text-brand-ink">
                      {user?.name || "Guest customer"}
                    </p>
                    <p>{user?.email || "No email on file"}</p>
                    {user && "role" in user ? (
                      <p className="text-xs uppercase tracking-[0.2em] text-brand-ink/50">
                        {String(user.role)}
                      </p>
                    ) : null}
                  </div>
                )}

                {mergeError ? (
                  <div className="mt-4 rounded-md border border-brand-cinnabar/30 bg-brand-cinnabar/5 px-3 py-2 text-sm text-brand-cinnabar">
                    {mergeError}
                  </div>
                ) : null}

                {latestOrder ? (
                  <div className="mt-6 rounded-md border border-brand-ink/10 bg-brand-ink/5 px-3 py-3 text-sm text-brand-ink/70">
                    <p className="text-xs uppercase tracking-[0.2em] text-brand-ink/50">Latest order</p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="font-semibold text-brand-ink">{latestOrder.id}</span>
                      <Link
                        href={`${basePath}/orders/${latestOrder.id}`}
                        className="text-xs font-semibold text-brand-ink"
                      >
                        Track
                      </Link>
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="rounded-xl border border-brand-ink/10 bg-white p-6 shadow-soft">
                <h2 className="text-lg font-semibold text-brand-ink">Saved addresses</h2>
                <div className="mt-4">
                  <AddressManager />
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-xl border border-brand-ink/10 bg-white p-6 shadow-soft">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-brand-ink">Order history</h2>
                  <span className="text-xs text-brand-ink/60">{orders.length} orders</span>
                </div>

                {ordersQuery.isLoading ? (
                  <div className="mt-4 space-y-3">
                    {Array.from({ length: 3 }).map((_, index) => (
                      <div key={index} className="h-14 rounded-lg bg-brand-ink/10" />
                    ))}
                  </div>
                ) : ordersQuery.isError ? (
                  <div className="mt-4 rounded-md border border-brand-cinnabar/30 bg-brand-cinnabar/5 px-3 py-2 text-sm text-brand-cinnabar">
                    Unable to load orders. Please try again.
                  </div>
                ) : !hasOrders ? (
                  <div className="mt-4 rounded-md border border-brand-ink/10 bg-brand-ink/5 px-3 py-3 text-sm text-brand-ink/60">
                    No orders yet. Start your first order from the menu.
                  </div>
                ) : (
                  <div className="mt-4 space-y-3">
                    {orders.map((order) => (
                      <div
                        key={order.id}
                        className="flex items-center justify-between rounded-lg border border-brand-ink/10 px-4 py-3 text-sm"
                      >
                        <div>
                          <p className="font-semibold text-brand-ink">{order.id}</p>
                          <p className="text-xs text-brand-ink/60">
                            {formatDate(order.createdAt)} · {order.orderType}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-brand-ink">
                            {formatCurrency(order.totalAmountMinor, order.displayCurrency)}
                          </p>
                          <div className="mt-1 flex items-center justify-end gap-2 text-xs">
                            <StatusBadge status={order.status} />
                            <Link
                              href={`${basePath}/orders/${order.id}`}
                              className="font-semibold text-brand-ink"
                            >
                              Track
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}

async function mergeGuestCart(setItemCount: (count: number) => void) {
  if (typeof window === "undefined") return;
  const guestId = window.localStorage.getItem("guestId");
  if (!guestId) return;

  const response = await fetch("/api/cart/merge", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ guestId })
  });

  if (response.ok) {
    window.localStorage.removeItem("guestId");
    setItemCount(0);
  } else {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error || "Failed to merge cart");
  }
}

function StatusBadge({ status }: { status: string }) {
  const normalized = status.replace(/_/g, " ");
  const style =
    status === "DELIVERED"
      ? "bg-brand-jade/10 text-brand-jade"
      : status === "CANCELLED" || status === "FAILED"
      ? "bg-brand-cinnabar/10 text-brand-cinnabar"
      : "bg-brand-ink/10 text-brand-ink/70";

  return <span className={`rounded-full px-2 py-1 ${style}`}>{normalized}</span>;
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
