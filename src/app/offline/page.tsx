"use client";

import { useEffect, useState } from "react";
import { getDictionary, normalizeLocale, t } from "@/lib/i18n";

export default function OfflinePage() {
  const [dict, setDict] = useState(() => getDictionary("en"));

  useEffect(() => {
    setDict(getDictionary(normalizeLocale(window.document.documentElement.lang)));
  }, []);

  return (
    <main className="bg-brand-rice">
      <div className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-6 py-12 text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-brand-ink/60">{t(dict, "offline.title")}</p>
        <h1 className="mt-4 font-display text-3xl text-brand-ink">{t(dict, "offline.title")}</h1>
        <p className="mt-3 text-sm text-brand-ink/70">{t(dict, "offline.body")}</p>
      </div>
    </main>
  );
}
