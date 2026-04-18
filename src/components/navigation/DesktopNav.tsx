import Link from "next/link";
import NavLinks from "@/components/navigation/NavLinks";
import LocaleCountrySwitcher from "@/components/navigation/LocaleCountrySwitcher";
import NotificationCenter from "@/features/notifications/components/NotificationCenter";

export default function DesktopNav({
  locale,
  country
}: {
  locale: string;
  country: string;
}) {
  return (
    <div className="hidden w-full items-center justify-between lg:flex">
      <Link href={`/${locale}/${country}`} className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-brand-cinnabar text-center text-sm font-semibold text-white">
          C
        </div>
        <div className="leading-tight">
          <p className="text-sm font-semibold">Charme</p>
          <p className="text-xs text-brand-ink/70">Supermarket & Restaurant</p>
        </div>
      </Link>
      <nav className="flex items-center gap-10">
        <NavLinks locale={locale} country={country} />
        <LocaleCountrySwitcher locale={locale} country={country} />
        <NotificationCenter />
      </nav>
    </div>
  );
}
