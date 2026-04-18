import "@/app/globals.css";
import type { Metadata } from "next";
import AppProviders from "@/components/providers/AppProviders";

export const metadata: Metadata = {
  title: "Charme Supermarket and Restaurant",
  description: "Premium Chinese and Taiwanese restaurant and supermarket in Nigeria.",
  manifest: "/manifest.json",
  themeColor: "#b22222",
  appleWebApp: {
    capable: true,
    title: "Charme",
    statusBarStyle: "default"
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.svg", type: "image/svg+xml" },
      { url: "/icons/icon-512.svg", type: "image/svg+xml" }
    ],
    apple: [{ url: "/icons/icon-512.svg", type: "image/svg+xml" }]
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-brand-rice text-brand-ink font-body antialiased">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
