"use client";

import Link from "next/link";
import { useUiStore } from "@/store/useUiStore";
import NavLinks from "@/components/navigation/NavLinks";
import LocaleCountrySwitcher from "@/components/navigation/LocaleCountrySwitcher";
import NotificationCenter from "@/features/notifications/components/NotificationCenter";

export default function MobileNav({
  locale,
  country
}: {
  locale: string;
  country: string;
}) {
  const { isMobileNavOpen, toggleMobileNav, closeMobileNav } = useUiStore();

  return (
    <div className="flex w-full items-center justify-between lg:hidden">
      <Link href={`/${locale}/${country}`} className="text-sm font-semibold">
        Charme
      </Link>
      <div className="flex items-center gap-2">
        <NotificationCenter />
        <button
          className="rounded-md border border-brand-ink/20 px-3 py-2 text-xs font-semibold"
          onClick={toggleMobileNav}
          aria-expanded={isMobileNavOpen}
          aria-controls="mobile-nav"
        >
          Menu
        </button>
      </div>
      {isMobileNavOpen ? (
        <div
          id="mobile-nav"
          className="fixed inset-0 z-40 bg-brand-ink/40 backdrop-blur"
          onClick={closeMobileNav}
        >
          <div
            className="absolute right-0 top-0 h-full w-72 bg-brand-rice p-6"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">Explore</p>
              <button className="text-xs" onClick={closeMobileNav}>
                Close
              </button>
            </div>
            <div className="mt-6 space-y-6">
              <NavLinks
                locale={locale}
                country={country}
                onNavigate={closeMobileNav}
              />
              <LocaleCountrySwitcher locale={locale} country={country} />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
