import type { Metadata } from "next";
import SiteShell from "@/components/layout/SiteShell";

export const metadata: Metadata = {
  title: "Charme",
  description: "Premium Chinese and Taiwanese restaurant and supermarket in Nigeria."
};

export default function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: { locale: string; country: string };
}) {
  return (
    <SiteShell locale={params.locale} country={params.country}>
      {children}
    </SiteShell>
  );
}
