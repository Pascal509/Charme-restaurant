"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { i18nConfig } from "@/lib/i18n/config";
import { isSupportedLocale, normalizeLocale } from "@/lib/i18n";
import { persistLocale } from "@/lib/i18n/persistence";

export default function LocaleCountrySwitcher({
  locale,
  country
}: {
  locale: string;
  country: string;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeLocale = normalizeLocale(locale);

  function getLocalizedPath(nextLocale: string): string {
    const normalizedLocale = normalizeLocale(nextLocale);
    const segments = pathname.split("/").filter(Boolean);

    if (segments.length === 0) {
      return `/${normalizedLocale}/${country}`;
    }

    if (isSupportedLocale(segments[0])) {
      segments[0] = normalizedLocale;
    } else {
      if (segments[0] === country) {
        segments.unshift(normalizedLocale);
      } else {
        segments.unshift(normalizedLocale, country);
      }
    }

    const nextPath = `/${segments.join("/")}`;
    const query = searchParams.toString();
    return query ? `${nextPath}?${query}` : nextPath;
  }

  return (
    <div className="flex items-center gap-3 text-xs text-brand-ink/70">
      {i18nConfig.locales.map((nextLocale) => (
        <Link
          key={nextLocale}
          href={getLocalizedPath(nextLocale)}
          onClick={() => persistLocale(nextLocale)}
          className={
            nextLocale === activeLocale
              ? "font-semibold text-brand-ink"
              : "hover:text-brand-ink"
          }
        >
          {nextLocale.toUpperCase()}
        </Link>
      ))}
    </div>
  );
}
