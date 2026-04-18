export const metadata = {
  title: "Offline | Charme"
};

export default function OfflinePage() {
  return (
    <main className="bg-brand-rice">
      <div className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-6 py-12 text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-brand-ink/60">Offline</p>
        <h1 className="mt-4 font-display text-3xl text-brand-ink">You&apos;re offline</h1>
        <p className="mt-3 text-sm text-brand-ink/70">
          We saved a lightweight page for you. Please reconnect to load live menus and orders.
        </p>
      </div>
    </main>
  );
}
