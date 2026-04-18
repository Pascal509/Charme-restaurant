import Container from "@/components/layout/Container";

export default function HomePage() {
  return (
    <main className="py-16">
      <Container>
        <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-6">
            <p className="text-sm uppercase tracking-[0.2em] text-brand-jade">
              Charme Supermarket and Restaurant
            </p>
            <h1 className="font-display text-4xl leading-tight text-brand-ink sm:text-5xl">
              Premium Chinese and Taiwanese cuisine with curated groceries.
            </h1>
            <p className="text-base text-brand-ink/80 sm:text-lg">
              Discover authentic flavors, imported ingredients, and a refined dining
              experience designed for Nigeria.
            </p>
            <div className="flex flex-wrap gap-3">
              <button className="rounded-md bg-brand-cinnabar px-5 py-3 text-sm font-semibold text-white shadow-soft">
                Order Food
              </button>
              <button className="rounded-md border border-brand-ink/20 px-5 py-3 text-sm font-semibold text-brand-ink">
                Shop Groceries
              </button>
            </div>
          </div>
          <div className="rounded-lg bg-white/60 p-8 shadow-crisp">
            <div className="space-y-4">
              <p className="text-xs uppercase tracking-[0.2em] text-brand-jade">
                Today at Charme
              </p>
              <h2 className="font-display text-2xl text-brand-ink">
                Signature dishes and imported pantry staples.
              </h2>
              <p className="text-sm text-brand-ink/70">
                Curated menus, premium grocery finds, and delivery tailored to your
                schedule.
              </p>
            </div>
          </div>
        </div>
      </Container>
    </main>
  );
}
