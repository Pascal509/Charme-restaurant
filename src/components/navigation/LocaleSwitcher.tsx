"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { isSupportedLocale, normalizeLocale } from "@/lib/i18n";
import { persistLocale } from "@/lib/i18n/persistence";

/**
 * Language/Locale Switcher Component
 * Allows users to switch between supported locales while preserving the current route
 */

interface LocaleSwitcherProps {
  currentLocale?: string;
  variant?: "inline" | "dropdown" | "button";
  className?: string;
}

const localeOptions = [
  { locale: "en", label: "EN", fullLabel: "English", flag: "🇬🇧" },
  { locale: "zh-CN", label: "中文", fullLabel: "简体中文", flag: "🇨🇳" }
] as const;

export default function LocaleSwitcher({
  currentLocale = "en",
  variant = "inline",
  className = ""
}: LocaleSwitcherProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeLocale = normalizeLocale(currentLocale);

  /**
   * Switch locale while preserving the current route path
   * Pattern: /[locale]/[country]/...rest
   */
  function getLocalizedPath(newLocale: string): string {
    const normalizedLocale = normalizeLocale(newLocale);
    const segments = pathname.split("/").filter(Boolean);

    if (segments.length === 0) {
      return `/${normalizedLocale}`;
    }

    if (isSupportedLocale(segments[0])) {
      segments[0] = normalizedLocale;
    } else {
      segments.unshift(normalizedLocale);
    }

    const nextPath = `/${segments.join("/")}`;
    const query = searchParams.toString();
    return query ? `${nextPath}?${query}` : nextPath;
  }

  function handleLocaleChange(nextLocale: string) {
    const persistedLocale = persistLocale(nextLocale);
    router.push(getLocalizedPath(persistedLocale));
  }

  function getLocaleButtonClass(isActive: boolean) {
    return [
      "inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold tracking-wide transition-all duration-200",
      "border backdrop-blur-sm",
      isActive
        ? "border-brand-gold bg-brand-gold/15 text-brand-gold shadow-[0_0_0_1px_rgba(212,175,55,0.15)]"
        : "border-brand-gold/15 bg-white/5 text-brand-ink/70 hover:border-brand-gold/30 hover:bg-white/10 hover:text-brand-ink"
    ].join(" ");
  }

  if (variant === "inline") {
    return (
      <div className={`inline-flex items-center rounded-full border border-brand-gold/15 bg-black/20 p-1 shadow-soft ${className}`}>
        {localeOptions.map((option) => {
          const isActive = activeLocale === option.locale;

          return (
            <Link
              key={option.locale}
              href={getLocalizedPath(option.locale)}
              onClick={() => persistLocale(option.locale)}
              aria-label={option.fullLabel}
              aria-current={isActive ? "page" : undefined}
              className={getLocaleButtonClass(isActive)}
            >
              <span aria-hidden="true" className="text-sm leading-none">
                {option.flag}
              </span>
              <span>{option.label}</span>
              {isActive ? <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" /> : null}
            </Link>
          );
        })}
      </div>
    );
  }

  if (variant === "dropdown") {
    return (
      <div className={`relative ${className}`}>
        <select
          value={activeLocale}
          onChange={(e) => {
            handleLocaleChange(e.target.value);
          }}
          aria-label="Select language"
          className="rounded-full border border-brand-gold/15 bg-black/25 px-3.5 py-2 text-sm text-brand-ink shadow-soft transition duration-200 focus:outline-none focus:ring-2 focus:ring-brand-gold/35"
        >
          {localeOptions.map((option) => (
            <option key={option.locale} value={option.locale}>
              {option.flag} {option.fullLabel}
            </option>
          ))}
        </select>
      </div>
    );
  }

  // button variant
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {localeOptions.map((option) => {
        const isActive = activeLocale === option.locale;

        return (
          <Link
            key={option.locale}
            href={getLocalizedPath(option.locale)}
            onClick={() => persistLocale(option.locale)}
            aria-label={option.fullLabel}
            aria-current={isActive ? "page" : undefined}
            className={getLocaleButtonClass(isActive)}
          >
            <span aria-hidden="true" className="text-sm leading-none">
              {option.flag}
            </span>
            <span>{option.fullLabel}</span>
            {isActive ? <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" /> : null}
          </Link>
        );
      })}
    </div>
  );
}
