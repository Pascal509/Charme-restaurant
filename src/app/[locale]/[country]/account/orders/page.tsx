import OrderHistoryPage from "@/features/account/components/OrderHistoryPage";

export default function OrdersRoute({
  params
}: {
  params: { locale: string; country: string };
}) {
  return <OrderHistoryPage locale={params.locale} country={params.country} />;
}
