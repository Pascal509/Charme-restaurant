import AccountPage from "@/features/account/components/AccountPage";

export async function generateMetadata({ params }: { params: { locale: string; country: string } }) {
  const meta = await import("@/lib/seo/metadata");
  return meta.buildLocalizedMetadata({
    params,
    title: "Account | Charme Restaurant",
    description: "Manage your profile, saved addresses, and order history.",
    pathname: `/${params.locale}/${params.country}/account`
  });
}

export default function AccountRoute({
  params
}: {
  params: { locale: string; country: string };
}) {
  return <AccountPage locale={params.locale} country={params.country} />;
}
