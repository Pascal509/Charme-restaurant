import "@/app/globals.css";
import type { Metadata, Viewport } from "next";
import AppProviders from "@/components/providers/AppProviders";

export const metadata: Metadata = {
  title: "Charme Supermarket and Restaurant",
  description: "Premium Chinese and Taiwanese restaurant and supermarket in Nigeria.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "Charme",
    statusBarStyle: "default"
  },
  icons: {
    icon: [{ url: "/icons/charme-logo.jpg", type: "image/jpeg" }],
    shortcut: [{ url: "/icons/charme-logo.jpg", type: "image/jpeg" }],
    apple: [{ url: "/icons/charme-logo.jpg", type: "image/jpeg" }]
  }
};

export const viewport: Viewport = {
  themeColor: "#0B0B0B"
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
