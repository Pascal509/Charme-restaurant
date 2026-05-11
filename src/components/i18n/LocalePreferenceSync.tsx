"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { normalizeLocale } from "@/lib/i18n";
import { persistLocale, readPersistedLocale } from "@/lib/i18n/persistence";

export default function LocalePreferenceSync({
  locale,
  country
}: {
  locale: string;
  country: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const urlLocale = normalizeLocale(locale);
    const savedLocale = readPersistedLocale();

    if (savedLocale && savedLocale !== urlLocale) {
      const segments = pathname.split("/").filter(Boolean);
      if (segments.length >= 2) {
        segments[0] = savedLocale;
      } else {
        segments.splice(0, segments.length, savedLocale, country);
      }

      const nextPath = `/${segments.join("/")}`;
      const query = searchParams.toString();
      const nextUrl = query ? `${nextPath}?${query}` : nextPath;
      router.replace(nextUrl);
      return;
    }

    persistLocale(urlLocale);
  }, [country, locale, pathname, router, searchParams]);

  return null;
}
