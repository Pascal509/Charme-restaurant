import Link from "next/link";
import Container from "@/components/layout/Container";
import { getDictionary, t } from "@/lib/i18n";

export default function CheckoutCancelPage({
  params
}: {
  params: { locale: string; country: string };
}) {
  const basePath = `/${params.locale}/${params.country}`;
  const dict = getDictionary(params.locale);

  return (
    <main className="bg-brand-rice">
      <Container className="py-16">
        <div className="mx-auto max-w-2xl rounded-2xl border border-brand-ink/10 bg-white p-8 shadow-soft">
          <p className="text-xs uppercase tracking-[0.3em] text-brand-ink/60">
            {t(dict, "checkoutResult.cancelledBadge")}
          </p>
          <h1 className="mt-3 font-display text-3xl text-brand-ink">
            {t(dict, "checkoutResult.cancelledTitle")}
          </h1>
          <p className="mt-4 text-sm text-brand-ink/70">
            {t(dict, "checkoutResult.cancelledBody")}
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href={`${basePath}/checkout`}
              className="rounded-md bg-brand-cinnabar px-5 py-3 text-center text-sm font-semibold text-white"
            >
              {t(dict, "checkoutResult.retryCheckout")}
            </Link>
            <Link
              href={`${basePath}/cart`}
              className="rounded-md border border-brand-ink/20 px-5 py-3 text-center text-sm font-semibold text-brand-ink"
            >
              {t(dict, "checkoutResult.backToCart")}
            </Link>
          </div>
        </div>
      </Container>
    </main>
  );
}
