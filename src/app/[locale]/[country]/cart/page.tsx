import CartPage from "@/features/cart/components/CartPage";

export async function generateMetadata({ params }: { params: { locale: string; country: string } }) {
  const meta = await import("@/lib/seo/metadata");
  return meta.buildLocalizedMetadata({
    params,
    title: "Cart | Charme Restaurant",
    description: "Review your selected dishes and market items before checkout.",
    pathname: `/${params.locale}/${params.country}/cart`
  });
}

export default function CartRoute({ params }: { params: { locale: string; country: string } }) {
  return <CartPage locale={params.locale} />;
}
