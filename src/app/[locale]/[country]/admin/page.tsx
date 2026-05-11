import AdminDashboardPage from "@/features/admin/components/AdminDashboardPage";

export async function generateMetadata({ params }: { params: { locale: string; country: string } }) {
  const meta = await import("@/lib/seo/metadata");
  return meta.buildLocalizedMetadata({
    params,
    title: "Admin Dashboard | Charme Restaurant",
    description: "Monitor live orders, metrics, and menu operations.",
    pathname: `/${params.locale}/${params.country}/admin`
  });
}

export default function AdminPage({ params }: { params: { locale: string; country: string } }) {
  return <AdminDashboardPage locale={params.locale} />;
}
