import React from "react";

export default function EmptyState({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
      <svg width="72" height="72" viewBox="0 0 24 24" fill="none" aria-hidden>
        <rect x="3" y="4" width="18" height="14" rx="2" stroke="rgba(232,225,214,0.7)" strokeWidth="1.25" />
        <path d="M3 18h18" stroke="rgba(232,225,214,0.45)" strokeWidth="1" />
      </svg>
      <h3 className="text-lg font-semibold text-brand-ink">{title}</h3>
      {subtitle ? <p className="max-w-md text-sm text-brand-ink/70">{subtitle}</p> : null}
    </div>
  );
}
