/**
 * i18n Helper - Centralized translation management
 * Provides typed, safe access to translations with English fallback
 */

import { en, type DictionaryType } from "./en";
import { zhCN } from "./zh-CN";

type Locale = "en" | "zh-CN";

const dictionaries: Record<Locale, DictionaryType> = {
  en,
  "zh-CN": zhCN
};

function getNestedValue(source: unknown, key: string): string | undefined {
  const keys = key.split(".");
  let value: unknown = source;

  for (const currentKey of keys) {
    if (typeof value === "object" && value !== null && currentKey in value) {
      value = (value as Record<string, unknown>)[currentKey];
      continue;
    }
    return undefined;
  }

  return typeof value === "string" ? value : undefined;
}

/**
 * Get the full translation dictionary for a locale
 * Falls back to English if locale is not supported
 */
export function getDictionary(locale?: string | null): DictionaryType {
  const normalized = normalizeLocale(locale);
  return dictionaries[normalized] ?? dictionaries.en;
}

/**
 * Safely access nested translation keys
 * Returns English fallback if key or locale is missing
 *
 * Usage:
 *   t(dict, 'offers.title')
 *   t(dict, 'about.mission.title')
 */
export function t(
  dictionary: DictionaryType | null | undefined,
  key: string,
  fallback?: string
): string {
  const fromLocale = getNestedValue(dictionary, key);
  if (fromLocale !== undefined) {
    return fromLocale;
  }

  const fromEnglish = getNestedValue(en, key);
  if (fromEnglish !== undefined) {
    return fromEnglish;
  }

  return fallback ?? key;
}

/**
 * Determine if locale is supported
 */
export function isSupportedLocale(locale?: string): locale is Locale {
  return locale === "en" || locale === "zh-CN" || locale === "zh";
}

/**
 * Get list of supported locales
 */
export function getSupportedLocales(): Locale[] {
  return ["en", "zh-CN"];
}

/**
 * Normalize locale string (zh -> zh-CN)
 */
export function normalizeLocale(locale?: string | null): Locale {
  if (!locale) return "en";
  if (locale === "zh" || locale === "zh-CN") return "zh-CN";
  if (locale === "en") return "en";
  return "en"; // Default fallback
}

export type { Locale, DictionaryType };
