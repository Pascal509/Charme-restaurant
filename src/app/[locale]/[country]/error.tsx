"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { getDictionary, normalizeLocale } from "@/lib/i18n";

export default function LocaleError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const params = useParams<{ locale?: string; country?: string }>();
  const locale = typeof params?.locale === "string" ? params.locale : undefined;
  const country = typeof params?.country === "string" ? params.country : undefined;
  const dictionary = getDictionary(normalizeLocale(locale));
  const basePath = locale && country ? `/${locale}/${country}` : "/";

  return (
    <main className="bg-brand-rice page-transition">
      <div className="mx-auto flex min-h-[70vh] max-w-3xl flex-col items-center justify-center px-6 py-16 text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-brand-ink/60">{dictionary.errors.oops}</p>
        <h1 className="mt-4 font-display text-3xl text-brand-ink sm:text-4xl">{dictionary.errors.unexpectedTitle}</h1>
        <p className="mt-3 max-w-xl text-sm text-brand-ink/70 sm:text-base">{dictionary.errors.unexpectedBody}</p>
        {error?.digest ? (
          <p className="mt-3 text-xs uppercase tracking-[0.2em] text-brand-ink/45">{dictionary.errors.digestLabel} {error.digest}</p>
        ) : null}
        <p className="mt-3 max-w-lg text-sm text-brand-ink/55">{dictionary.errors.unexpectedHelp}</p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            onClick={() => reset()}
            className="rounded-full bg-brand-cinnabar px-5 py-3 text-sm font-semibold text-white transition hover:shadow-soft"
          >
            {dictionary.errors.retry}
          </button>
          <Link
            href={basePath}
            className="rounded-full border border-brand-ink/15 px-5 py-3 text-sm font-semibold text-brand-ink transition hover:bg-white"
          >
            {dictionary.errors.goHome}
          </Link>
        </div>
      </div>
    </main>
  );
}