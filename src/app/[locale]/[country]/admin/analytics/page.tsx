import AdminAnalyticsPage from "@/features/admin/components/AdminAnalyticsPage";

export default function AnalyticsPage({ params }: { params: { locale: string; country: string } }) {
  return <AdminAnalyticsPage locale={params.locale} />;
}
