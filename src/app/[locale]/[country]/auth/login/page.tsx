import LoginPage from "@/features/auth/components/LoginPage";

export default function LoginRoute({
  params
}: {
  params: { locale: string; country: string };
}) {
  return <LoginPage locale={params.locale} country={params.country} />;
}
