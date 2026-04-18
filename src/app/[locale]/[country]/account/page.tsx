import AccountPage from "@/features/account/components/AccountPage";

export default function AccountRoute({
  params
}: {
  params: { locale: string; country: string };
}) {
  return <AccountPage locale={params.locale} country={params.country} />;
}
