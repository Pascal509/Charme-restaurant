import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import NavLinks from "@/components/navigation/NavLinks";
import LocaleCountrySwitcher from "@/components/navigation/LocaleCountrySwitcher";
import CartIconLink from "@/components/navigation/CartIconLink";
import { getDictionary, t } from "@/lib/i18n";

const NotificationCenter = dynamic(
  () => import("@/features/notifications/components/NotificationCenter"),
  { ssr: false, loading: () => null }
);

export default function DesktopNav({
  locale,
  country
}: {
  locale: string;
  country: string;
}) {
  const dict = getDictionary(locale);

  return (
    <div className="hidden w-full items-center justify-between lg:flex">
      <Link href={`/${locale}/${country}`} className="flex items-center gap-3">
        <div className="relative h-10 w-10 overflow-hidden rounded-full border border-brand-gold/30">
          <Image
            src="/icons/charme-logo.jpg"
            alt="Charme logo"
            fill
            sizes="40px"
            className="object-cover"
            priority
          />
        </div>
        <div className="leading-tight">
          <p className="text-sm font-semibold">Charme</p>
          <p className="text-xs text-brand-ink/70">{t(dict, "brand.tagline")}</p>
        </div>
      </Link>
      <nav className="flex items-center gap-10">
        <NavLinks locale={locale} country={country} />
        <LocaleCountrySwitcher locale={locale} country={country} />
        <NotificationCenter />
        <CartIconLink locale={locale} country={country} />
      </nav>
    </div>
  );
}
