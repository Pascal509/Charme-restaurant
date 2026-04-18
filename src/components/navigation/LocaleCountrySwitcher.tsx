import Link from "next/link";
import { i18nConfig } from "@/lib/i18n/config";

export default function LocaleCountrySwitcher({
  locale,
  country
}: {
  locale: string;
  country: string;
}) {
  return (
    <div className="flex items-center gap-3 text-xs text-brand-ink/70">
      {i18nConfig.locales.map((nextLocale) => (
        <Link
          key={nextLocale}
          href={`/${nextLocale}/${country}`}
          className={
            nextLocale === locale
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
