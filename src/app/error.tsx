"use client";

export default function GlobalError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="bg-brand-rice text-brand-ink">
        <div className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-6 py-12 text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-brand-ink/60">Oops</p>
          <h1 className="mt-4 font-display text-3xl text-brand-ink">Something went wrong</h1>
          <p className="mt-3 text-sm text-brand-ink/70">
            {error?.message || "We hit a snag while loading this page. Please try again."}
          </p>
          <button
            onClick={() => reset()}
            className="mt-6 rounded-md bg-brand-cinnabar px-4 py-2 text-sm font-semibold text-white"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
