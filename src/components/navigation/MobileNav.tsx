"use client";

import Link from "next/link";
import Image from "next/image";
import { useUiStore } from "@/store/useUiStore";
import NavLinks from "@/components/navigation/NavLinks";
import LocaleCountrySwitcher from "@/components/navigation/LocaleCountrySwitcher";
import NotificationCenter from "@/features/notifications/components/NotificationCenter";
import CartIconLink from "@/components/navigation/CartIconLink";

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
      <Link href={`/${locale}/${country}`} className="flex items-center gap-2 text-sm font-semibold">
        <div className="relative h-8 w-8 overflow-hidden rounded-full border border-brand-gold/30">
          <Image
            src="/icons/charme-logo.jpg"
            alt="Charme logo"
            fill
            sizes="32px"
            className="object-cover"
            priority
          />
        </div>
        Charme
      </Link>
      <div className="flex items-center gap-2">
        <NotificationCenter />
        <CartIconLink locale={locale} country={country} />
        <button
          className="btn btn-outline text-xs"
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
              <button className="btn btn-outline text-xs" onClick={closeMobileNav}>
                Close
              </button>
            </div>
            <div className="mt-6 space-y-6">
              <div className="rounded-2xl border border-brand-gold/10 bg-white/5 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-gold/70">
                  Choose Experience
                </p>
                <div className="mt-4 grid gap-2">
                  <Link
                    href={`/${locale}/${country}/menu`}
                    onClick={closeMobileNav}
                    className="rounded-full border border-brand-gold/30 px-4 py-2 text-sm font-semibold text-brand-gold transition hover:bg-brand-gold/10"
                  >
                    Menu
                  </Link>
                  <Link
                    href={`/${locale}/${country}/market`}
                    onClick={closeMobileNav}
                    className="rounded-full border border-brand-gold/30 px-4 py-2 text-sm font-semibold text-brand-gold transition hover:bg-brand-gold/10"
                  >
                    Market
                  </Link>
                </div>
              </div>
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
