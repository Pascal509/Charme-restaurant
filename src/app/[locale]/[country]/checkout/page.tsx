import CheckoutPage from "@/features/checkout/components/CheckoutPage";
import { getDefaultPaymentProvider } from "@/features/payment/services/paymentConfig";

export async function generateMetadata({ params }: { params: { locale: string; country: string } }) {
  const meta = await import("@/lib/seo/metadata");
  return meta.buildLocalizedMetadata({
    params,
    title: "Checkout | Charme Restaurant",
    description: "Confirm fulfillment details and continue to secure payment.",
    pathname: `/${params.locale}/${params.country}/checkout`
  });
}

export default function CheckoutRoute({ params }: { params: { locale: string; country: string } }) {
  return (
    <CheckoutPage
      locale={params.locale}
      defaultPaymentProvider={getDefaultPaymentProvider()}
    />
  );
}
