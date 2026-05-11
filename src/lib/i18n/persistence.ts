import { isSupportedLocale, normalizeLocale, type Locale } from "@/lib/i18n";

export const LOCALE_STORAGE_KEY = "charme.locale";
const LOCALE_COOKIE_KEY = "charme_locale";

export function readPersistedLocale(): Locale | null {
  if (typeof window === "undefined") {
    return null;
  }

  const fromStorage = window.localStorage.getItem(LOCALE_STORAGE_KEY);
  if (fromStorage && isSupportedLocale(fromStorage)) {
    return normalizeLocale(fromStorage);
  }

  const cookieMatch = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith(`${LOCALE_COOKIE_KEY}=`));
  const fromCookie = cookieMatch?.split("=")[1];

  if (fromCookie && isSupportedLocale(fromCookie)) {
    return normalizeLocale(fromCookie);
  }

  return null;
}

export function persistLocale(locale: string): Locale {
  const normalized = normalizeLocale(locale);

  if (typeof window === "undefined") {
    return normalized;
  }

  window.localStorage.setItem(LOCALE_STORAGE_KEY, normalized);
  document.cookie = `${LOCALE_COOKIE_KEY}=${normalized}; Path=/; Max-Age=31536000; SameSite=Lax`;
  return normalized;
}
