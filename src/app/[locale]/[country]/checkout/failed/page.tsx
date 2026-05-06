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

export default async function CheckoutFailedPage({
  params,
  searchParams
}: {
  params: { locale: string; country: string };
  searchParams: { orderId?: string };
}) {
  const basePath = `/${params.locale}/${params.country}`;
  const order = await getCheckoutResultOrderSummary(searchParams.orderId);

  return (
    <main className="bg-brand-rice page-transition">
      <Container className="py-20">
        <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="overflow-hidden rounded-3xl border border-brand-cinnabar/20 bg-white shadow-soft">
            <div className="border-b border-brand-cinnabar/10 p-8">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-cinnabar/10 text-brand-cinnabar">
                <svg
                  viewBox="0 0 24 24"
                  className="h-8 w-8"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 8v5" />
                  <path d="M12 16h.01" />
                  <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3l-8.47-14.14a2 2 0 0 0-3.42 0Z" />
                </svg>
              </div>

              <div className="mt-6">
                <p className="text-xs uppercase tracking-[0.3em] text-brand-cinnabar/70">Payment failed</p>
                <h1 className="mt-4 text-3xl text-brand-ink sm:text-4xl">We couldn’t complete your payment</h1>
                <p className="mt-4 max-w-xl text-sm text-brand-ink/70 sm:text-base">
                  No order was finalized from this attempt. You can retry checkout or go back to your cart and try again.
                </p>
              </div>
            </div>

            <div className="p-8">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-brand-ink/10 bg-brand-rice p-4">
                  <p className="text-xs uppercase tracking-[0.3em] text-brand-ink/50">Order ID</p>
                  <p className="mt-2 break-all text-sm text-brand-ink">{order?.id ?? searchParams.orderId ?? "Not available"}</p>
                </div>
                <div className="rounded-2xl border border-brand-ink/10 bg-brand-rice p-4">
                  <p className="text-xs uppercase tracking-[0.3em] text-brand-ink/50">Status</p>
                  <p className="mt-2 text-sm text-brand-ink">Payment was declined or interrupted</p>
                </div>
              </div>

              {order ? (
                <div className="mt-6 rounded-2xl border border-brand-ink/10 bg-brand-rice p-5">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.3em] text-brand-ink/50">Last order attempt</p>
                      <h2 className="mt-2 text-lg text-brand-ink">Order summary</h2>
                    </div>
                    <span className="rounded-full border border-brand-cinnabar/20 px-3 py-1 text-[10px] uppercase tracking-[0.3em] text-brand-cinnabar">
                      {order.paymentStatus}
                    </span>
                  </div>

                  <ul className="mt-4 space-y-3">
                    {order.items.map((item) => (
                      <li key={item.id} className="flex items-start justify-between gap-4 border-b border-brand-ink/5 pb-3 last:border-0 last:pb-0">
                        <div>
                          <p className="text-sm font-medium text-brand-ink">{item.displayName}</p>
                          <p className="mt-1 text-xs text-brand-ink/55">Qty {item.quantity} · {formatCurrency(item.unitAmountMinor, item.currency)} each</p>
                        </div>
                        <p className="text-sm text-brand-ink">{formatCurrency(item.lineTotalMinor, item.currency)}</p>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-5 flex items-center justify-between rounded-xl border border-brand-cinnabar/15 bg-white px-3 py-2 text-sm font-semibold text-brand-ink">
                    <span>Total</span>
                    <span>{formatCurrency(order.totalAmountMinor, order.displayCurrency)}</span>
                  </div>
                </div>
              ) : null}

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link href={`${basePath}/checkout`} className="rounded-full bg-brand-cinnabar px-5 py-3 text-center text-sm font-semibold text-white transition hover:shadow-soft">
                  Retry checkout
                </Link>
                <Link href={`${basePath}/cart`} className="rounded-full border border-brand-ink/20 px-5 py-3 text-center text-sm font-semibold text-brand-ink transition hover:bg-white">
                  Back to cart
                </Link>
              </div>
            </div>
          </section>

          <aside className="rounded-3xl border border-brand-ink/10 bg-white/80 p-8 shadow-soft">
            <p className="text-xs uppercase tracking-[0.3em] text-brand-ink/50">Need help?</p>
            <h2 className="mt-3 text-2xl text-brand-ink">Try again with confidence</h2>
            <div className="mt-6 space-y-4 text-sm text-brand-ink/70">
              <p>If your bank already debited you, the payment confirmation may still arrive shortly.</p>
              <p>Otherwise, head back to your cart, review the items, and place the order again.</p>
              <p>You can also restart checkout with the same cart when you’re ready.</p>
            </div>
          </aside>
        </div>
      </Container>
    </main>
  );
}