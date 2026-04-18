import RegisterPage from "@/features/auth/components/RegisterPage";

export default function RegisterRoute({
  params
}: {
  params: { locale: string; country: string };
}) {
  return <RegisterPage locale={params.locale} country={params.country} />;
}
