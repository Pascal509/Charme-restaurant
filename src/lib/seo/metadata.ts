import { getDictionary, t, type DictionaryType } from "@/lib/i18n";
import { env } from "@/lib/env";
import type { Metadata } from "next";

type BuildOptions = {
  params: { locale: string; country: string };
  titleKey?: string;
  descriptionKey?: string;
  title?: string;
  description?: string;
  pathname?: string; // path relative to root, e.g. /en/ng/menu
  image?: string; // path to image under /public
  type?: "website" | "article";
};

export function buildLocalizedMetadata(options: BuildOptions): Metadata {
  const { params, titleKey, descriptionKey, title, description, pathname, image, type = "website" } = options;
  const dict: DictionaryType = getDictionary(params.locale);
  const locale = params.locale === "zh-CN" ? "zh-CN" : "en";
  const alternateLocale = locale === "en" ? "zh-CN" : "en";

  const siteName = "Charme Restaurant";

  // use the typed i18n accessor `t` for safe lookups
  const resolvedTitle = title ?? (titleKey ? t(dict, titleKey) : dict.brand?.description ?? siteName);
  const resolvedDescription = description ?? (descriptionKey ? t(dict, descriptionKey) : dict.brand?.description ?? "");

  const base = env.NEXTAUTH_URL.replace(/\/$/, "");
  const canonical = pathname ? `${base}${pathname}` : `${base}/${params.locale}/${params.country}`;
  const alternatePath = pathname
    ? pathname.replace(/^\/(en|zh-CN)/, `/${alternateLocale}`)
    : `/${alternateLocale}/${params.country}`;

  const images = image ? [{ url: `${base}${image}` }] : [{ url: `${base}/icons/charme-logo.jpg` }];

  const metadata: Metadata = {
    title: resolvedTitle,
    description: resolvedDescription,
    alternates: {
      canonical,
      languages: {
        [locale]: canonical,
        [alternateLocale]: `${base}${alternatePath}`
      }
    },
    openGraph: {
      title: resolvedTitle,
      description: resolvedDescription,
      url: canonical,
      siteName,
      locale,
      type,
      images
    },
    twitter: {
      title: resolvedTitle,
      description: resolvedDescription,
      card: "summary_large_image",
      images: images.map((i) => i.url)
    }
  };

  return metadata;
}

