import Link from "next/link";
import Container from "@/components/layout/Container";
import { getCheckoutResultOrderSummary } from "@/features/orders/services/checkoutResultService";
import { getDictionary, t } from "@/lib/i18n";

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
  const dict = getDictionary(params.locale);
  let order = null;

  try {
    order = await getCheckoutResultOrderSummary(searchParams.orderId);
  } catch {
    order = null;
  }

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
                <p className="seal-badge">{t(dict, "checkoutResult.successBadge")}</p>
                <h1 className="mt-4 text-3xl text-brand-ink sm:text-4xl">{t(dict, "checkoutResult.confirmedTitle")}</h1>
                <p className="mt-4 max-w-xl text-sm text-brand-ink/70 sm:text-base">
                  {t(dict, "checkoutResult.confirmedBody")}
                </p>
              </div>
            </div>

            <div className="p-8">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-brand-gold/10 bg-black/30 p-4">
                  <p className="text-xs uppercase tracking-[0.3em] text-brand-gold/70">{t(dict, "checkoutResult.orderId")}</p>
                  <p className="mt-2 break-all text-sm text-brand-ink">{order?.id ?? searchParams.orderId ?? t(dict, "checkoutResult.pending")}</p>
                </div>
                <div className="rounded-2xl border border-brand-gold/10 bg-black/30 p-4">
                  <p className="text-xs uppercase tracking-[0.3em] text-brand-gold/70">{t(dict, "checkoutResult.total")}</p>
                  <p className="mt-2 text-sm text-brand-ink">
                    {order ? formatCurrency(order.totalAmountMinor, order.displayCurrency) : t(dict, "checkoutResult.receiptPending")}
                  </p>
                </div>
              </div>

              <div className="mt-6 rounded-2xl border border-brand-gold/10 bg-black/30 p-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-brand-gold/70">{t(dict, "checkoutResult.items")}</p>
                    <h2 className="mt-2 text-lg text-brand-ink">{t(dict, "checkoutResult.orderSummary")}</h2>
                  </div>
                  <span className="rounded-full border border-brand-gold/20 px-3 py-1 text-[10px] uppercase tracking-[0.3em] text-brand-gold/80">
                    {order?.paymentStatus ? (order.paymentStatus === "PAID" ? t(dict, "orders.statusPaid") : order.paymentStatus) : t(dict, "checkoutResult.pending")}
                  </span>
                </div>

                {order?.items?.length ? (
                  <ul className="mt-4 space-y-3">
                    {order.items.map((item) => (
                      <li key={item.id} className="flex items-start justify-between gap-4 border-b border-white/5 pb-3 last:border-0 last:pb-0">
                        <div>
                          <p className="text-sm font-medium text-brand-ink">{item.displayName}</p>
                          <p className="mt-1 text-xs text-brand-ink/55">{t(dict, "orders.qty")} {item.quantity} · {formatCurrency(item.unitAmountMinor, item.currency)} {t(dict, "checkoutResult.itemEach")}</p>
                        </div>
                        <p className="text-sm text-brand-ink">{formatCurrency(item.lineTotalMinor, item.currency)}</p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-4 text-sm text-brand-ink/60">
                    {t(dict, "checkoutResult.detailsUnavailable")}
                  </p>
                )}

                {order ? (
                  <dl className="mt-5 grid gap-2 text-sm text-brand-ink/75 sm:grid-cols-2">
                    <div className="flex items-center justify-between rounded-xl bg-white/5 px-3 py-2">
                      <dt>{t(dict, "checkoutResult.subtotal")}</dt>
                      <dd>{formatCurrency(order.subtotalAmountMinor, order.displayCurrency)}</dd>
                    </div>
                    <div className="flex items-center justify-between rounded-xl bg-white/5 px-3 py-2">
                      <dt>{t(dict, "checkoutResult.deliveryFee")}</dt>
                      <dd>{formatCurrency(order.deliveryFeeAmountMinor, order.displayCurrency)}</dd>
                    </div>
                    <div className="flex items-center justify-between rounded-xl bg-white/5 px-3 py-2">
                      <dt>{t(dict, "checkoutResult.tax")}</dt>
                      <dd>{formatCurrency(order.taxAmountMinor, order.displayCurrency)}</dd>
                    </div>
                    <div className="flex items-center justify-between rounded-xl border border-brand-gold/20 bg-brand-gold/10 px-3 py-2 font-semibold text-brand-ink">
                      <dt>{t(dict, "checkoutResult.total")}</dt>
                      <dd>{formatCurrency(order.totalAmountMinor, order.displayCurrency)}</dd>
                    </div>
                  </dl>
                ) : null}
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <Link href={basePath} className="btn btn-gold">
                  {t(dict, "checkoutResult.returnToMenu")}
                </Link>
                <Link href={`${basePath}/orders`} className="btn btn-outline">
                  {t(dict, "checkoutResult.viewOrders")}
                </Link>
              </div>
            </div>
          </section>

          <aside className="rounded-3xl border border-brand-gold/10 bg-black/30 p-8 shadow-soft">
            <p className="text-xs uppercase tracking-[0.3em] text-brand-gold/70">{t(dict, "checkoutResult.nextSteps")}</p>
            <h2 className="mt-3 text-2xl text-brand-ink">{t(dict, "checkoutResult.whatHappensNow")}</h2>
            <div className="mt-6 space-y-4 text-sm text-brand-ink/70">
              <p>{t(dict, "checkoutResult.kitchenQueue")}</p>
              <p>{t(dict, "checkoutResult.keepBrowsing")}</p>
              <p>{t(dict, "checkoutResult.keepOrderId")}</p>
            </div>
          </aside>
        </div>
      </Container>
    </main>
  );
}
