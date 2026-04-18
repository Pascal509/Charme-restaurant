import Link from "next/link";
import Container from "@/components/layout/Container";

export default function CheckoutCancelPage({
  params
}: {
  params: { locale: string; country: string };
}) {
  const basePath = `/${params.locale}/${params.country}`;

  return (
    <main className="bg-brand-rice">
      <Container className="py-16">
        <div className="mx-auto max-w-2xl rounded-2xl border border-brand-ink/10 bg-white p-8 shadow-soft">
          <p className="text-xs uppercase tracking-[0.3em] text-brand-ink/60">
            Payment cancelled
          </p>
          <h1 className="mt-3 font-display text-3xl text-brand-ink">
            Checkout not completed
          </h1>
          <p className="mt-4 text-sm text-brand-ink/70">
            Your payment was not completed. You can retry checkout or return to your cart to
            review items.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href={`${basePath}/checkout`}
              className="rounded-md bg-brand-cinnabar px-5 py-3 text-center text-sm font-semibold text-white"
            >
              Retry Checkout
            </Link>
            <Link
              href={`${basePath}/cart`}
              className="rounded-md border border-brand-ink/20 px-5 py-3 text-center text-sm font-semibold text-brand-ink"
            >
              Back to Cart
            </Link>
          </div>
        </div>
      </Container>
    </main>
  );
}
