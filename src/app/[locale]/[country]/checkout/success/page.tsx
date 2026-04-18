import Link from "next/link";
import Container from "@/components/layout/Container";

export default function CheckoutSuccessPage({
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
            Payment successful
          </p>
          <h1 className="mt-3 font-display text-3xl text-brand-ink">
            Order confirmed
          </h1>
          <p className="mt-4 text-sm text-brand-ink/70">
            Thank you for your order. We are preparing everything now. You can track your
            order progress or return to the home page.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href={`${basePath}/orders`}
              className="rounded-md bg-brand-cinnabar px-5 py-3 text-center text-sm font-semibold text-white"
            >
              Track Order
            </Link>
            <Link
              href={basePath}
              className="rounded-md border border-brand-ink/20 px-5 py-3 text-center text-sm font-semibold text-brand-ink"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </Container>
    </main>
  );
}
