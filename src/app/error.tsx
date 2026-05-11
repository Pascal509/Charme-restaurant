"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getDictionary, normalizeLocale, t } from "@/lib/i18n";

export default function GlobalError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [dict, setDict] = useState(() => getDictionary("en"));

  useEffect(() => {
    const pathname = window.location.pathname.split("/").filter(Boolean);
    setDict(getDictionary(normalizeLocale(pathname[0])));
  }, []);

  return (
    <html lang="en">
      <body className="bg-brand-rice text-brand-ink">
        <div className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-6 py-12 text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-brand-ink/60">{t(dict, "errors.oops")}</p>
          <h1 className="mt-4 font-display text-3xl text-brand-ink">{t(dict, "errors.unexpectedTitle")}</h1>
          <p className="mt-3 text-sm text-brand-ink/70">{t(dict, "errors.unexpectedBody")}</p>
          {error?.digest ? (
            <p className="mt-3 text-xs uppercase tracking-[0.2em] text-brand-ink/45">{t(dict, "errors.digestLabel")} {error.digest}</p>
          ) : null}
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button
              onClick={() => reset()}
              className="rounded-md bg-brand-cinnabar px-4 py-2 text-sm font-semibold text-white"
            >
              {t(dict, "errors.retry")}
            </button>
            <Link
              href="/"
              className="rounded-md border border-brand-ink/15 px-4 py-2 text-sm font-semibold text-brand-ink transition hover:bg-white"
            >
              {t(dict, "errors.goHome")}
            </Link>
          </div>
        </div>
      </body>
    </html>
  );
}
