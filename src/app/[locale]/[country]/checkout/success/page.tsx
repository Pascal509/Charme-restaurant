import Link from "next/link";
import Container from "@/components/layout/Container";

export default function CheckoutSuccessPage({
  params
}: {
  params: { locale: string; country: string };
}) {
  const basePath = `/${params.locale}/${params.country}`;

  return (
    <main className="bg-brand-obsidian text-brand-ink page-transition">
      <Container className="py-20">
        <div className="mx-auto flex max-w-2xl flex-col items-center gap-6 rounded-3xl border border-brand-gold/10 bg-white/5 p-10 text-center shadow-crisp">
          <div className="success-ring flex h-20 w-20 items-center justify-center rounded-full bg-black/40">
            <svg
              viewBox="0 0 52 52"
              className="h-10 w-10"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path className="check-draw" d="M14 27l8 8 16-18" />
            </svg>
          </div>
          <div className="animate-rise-in">
            <p className="seal-badge mx-auto">Payment Successful</p>
            <h1 className="mt-4 text-3xl text-brand-ink sm:text-4xl">
              Order confirmed
            </h1>
            <p className="mt-4 text-sm text-brand-ink/70 sm:text-base">
              Thank you for your order. We are preparing everything now. You can track your
              order progress or return to the home page.
            </p>
          </div>
          <div className="mt-2 flex flex-col gap-3 sm:flex-row">
            <Link href={`${basePath}/orders`} className="btn btn-gold">
              Track Order
            </Link>
            <Link href={basePath} className="btn btn-outline">
              Back to Home
            </Link>
          </div>
        </div>
      </Container>
    </main>
  );
}
