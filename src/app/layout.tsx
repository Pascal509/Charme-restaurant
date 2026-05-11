import "@/app/globals.css";
import type { Metadata, Viewport } from "next";
import AppProviders from "@/components/providers/AppProviders";
import { env } from "@/lib/env";

export const metadata: Metadata = {
  title: "Charme Restaurant - Maitama, Abuja",
  description: "Premium Chinese and Taiwanese restaurant and supermarket at No. 41 Gana Street, Maitama, Abuja, Nigeria.",
  metadataBase: new URL(env.NEXTAUTH_URL),
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
  },
  openGraph: {
    title: "Charme Restaurant - Maitama, Abuja",
    description: "Premium Chinese and Taiwanese restaurant and supermarket at No. 41 Gana Street, Maitama, Abuja, Nigeria.",
    siteName: "Charme Restaurant",
    type: "website",
    images: [{ url: "/icons/charme-logo.jpg" }]
  },
  twitter: {
    card: "summary_large_image",
    title: "Charme Restaurant - Maitama, Abuja",
    description: "Premium Chinese and Taiwanese restaurant and supermarket at No. 41 Gana Street, Maitama, Abuja, Nigeria.",
    images: ["/icons/charme-logo.jpg"]
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
