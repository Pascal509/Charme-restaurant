import Link from "next/link";
import Container from "@/components/layout/Container";
import { getCheckoutResultOrderSummary } from "@/features/orders/services/checkoutResultService";

export const dynamic = "force-dynamic";

function formatCurrency(amountMinor: number, currency: string) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amountMinor / 100);
}

export default async function CheckoutSuccessPage({
  params
  ,
  searchParams
}: {
  params: { locale: string; country: string };
  searchParams: { orderId?: string };
}) {
  const basePath = `/${params.locale}/${params.country}`;
  const order = await getCheckoutResultOrderSummary(searchParams.orderId);

  return (
    <main className="bg-brand-obsidian text-brand-ink page-transition">
      <Container className="py-20">
        <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="overflow-hidden rounded-3xl border border-brand-gold/10 bg-white/5 shadow-crisp">
            <div className="border-b border-brand-gold/10 p-8">
              <div className="success-ring flex h-16 w-16 items-center justify-center rounded-full bg-black/40">
                <svg
                  viewBox="0 0 52 52"
                  className="h-9 w-9"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path className="check-draw" d="M14 27l8 8 16-18" />
                </svg>
              </div>
              <div className="mt-6 animate-rise-in">
                <p className="seal-badge">Payment Successful</p>
                <h1 className="mt-4 text-3xl text-brand-ink sm:text-4xl">
                  Your order is confirmed
                </h1>
                <p className="mt-4 max-w-xl text-sm text-brand-ink/70 sm:text-base">
                  Thank you. Your payment went through and the kitchen is getting started on your
                  order right away.
                </p>
              </div>
            </div>

            <div className="p-8">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-brand-gold/10 bg-black/30 p-4">
                  <p className="text-xs uppercase tracking-[0.3em] text-brand-gold/70">Order ID</p>
                  <p className="mt-2 break-all text-sm text-brand-ink">{order?.id ?? searchParams.orderId ?? "Pending"}</p>
                </div>
                <div className="rounded-2xl border border-brand-gold/10 bg-black/30 p-4">
                  <p className="text-xs uppercase tracking-[0.3em] text-brand-gold/70">Total</p>
                  <p className="mt-2 text-sm text-brand-ink">
                    {order ? formatCurrency(order.totalAmountMinor, order.displayCurrency) : "Your receipt will appear here shortly"}
                  </p>
                </div>
              </div>

              <div className="mt-6 rounded-2xl border border-brand-gold/10 bg-black/30 p-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-brand-gold/70">Items</p>
                    <h2 className="mt-2 text-lg text-brand-ink">Order summary</h2>
                  </div>
                  <span className="rounded-full border border-brand-gold/20 px-3 py-1 text-[10px] uppercase tracking-[0.3em] text-brand-gold/80">
                    {order?.paymentStatus ?? "PAID"}
                  </span>
                </div>

                {order?.items?.length ? (
                  <ul className="mt-4 space-y-3">
                    {order.items.map((item) => (
                      <li key={item.id} className="flex items-start justify-between gap-4 border-b border-white/5 pb-3 last:border-0 last:pb-0">
                        <div>
                          <p className="text-sm font-medium text-brand-ink">{item.displayName}</p>
                          <p className="mt-1 text-xs text-brand-ink/55">Qty {item.quantity} · {formatCurrency(item.unitAmountMinor, item.currency)} each</p>
                        </div>
                        <p className="text-sm text-brand-ink">{formatCurrency(item.lineTotalMinor, item.currency)}</p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-4 text-sm text-brand-ink/60">
                    We could not load the line items, but your payment was confirmed.
                  </p>
                )}

                {order ? (
                  <dl className="mt-5 grid gap-2 text-sm text-brand-ink/75 sm:grid-cols-2">
                    <div className="flex items-center justify-between rounded-xl bg-white/5 px-3 py-2">
                      <dt>Subtotal</dt>
                      <dd>{formatCurrency(order.subtotalAmountMinor, order.displayCurrency)}</dd>
                    </div>
                    <div className="flex items-center justify-between rounded-xl bg-white/5 px-3 py-2">
                      <dt>Delivery fee</dt>
                      <dd>{formatCurrency(order.deliveryFeeAmountMinor, order.displayCurrency)}</dd>
                    </div>
                    <div className="flex items-center justify-between rounded-xl bg-white/5 px-3 py-2">
                      <dt>Tax</dt>
                      <dd>{formatCurrency(order.taxAmountMinor, order.displayCurrency)}</dd>
                    </div>
                    <div className="flex items-center justify-between rounded-xl border border-brand-gold/20 bg-brand-gold/10 px-3 py-2 font-semibold text-brand-ink">
                      <dt>Total</dt>
                      <dd>{formatCurrency(order.totalAmountMinor, order.displayCurrency)}</dd>
                    </div>
                  </dl>
                ) : null}
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link href={basePath} className="btn btn-gold">
                  Return to menu
                </Link>
                <Link href={`${basePath}/orders`} className="btn btn-outline">
                  View orders
                </Link>
              </div>
            </div>
          </section>

          <aside className="rounded-3xl border border-brand-gold/10 bg-black/30 p-8 shadow-soft">
            <p className="text-xs uppercase tracking-[0.3em] text-brand-gold/70">Next steps</p>
            <h2 className="mt-3 text-2xl text-brand-ink">What happens now</h2>
            <div className="mt-6 space-y-4 text-sm text-brand-ink/70">
              <p>Your order is now in the kitchen queue.</p>
              <p>You can keep browsing the menu or open your order history anytime.</p>
              <p>If you need to double-check anything, keep the order ID handy for support.</p>
            </div>
          </aside>
        </div>
      </Container>
    </main>
  );
}
