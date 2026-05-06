import CheckoutPage from "@/features/checkout/components/CheckoutPage";
import { getDefaultPaymentProvider } from "@/features/payment/services/paymentConfig";

export default function CheckoutRoute() {
  return <CheckoutPage defaultPaymentProvider={getDefaultPaymentProvider()} />;
}
