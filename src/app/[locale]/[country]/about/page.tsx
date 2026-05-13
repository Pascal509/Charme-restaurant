import Link from "next/link";
import Container from "@/components/layout/Container";
import SectionHero from "@/components/sections/SectionHero";
import LocaleSwitcher from "@/components/navigation/LocaleSwitcher";
import { getDictionary, t } from "@/lib/i18n";

interface AboutPageProps {
  params: { locale: string; country: string };
}

export async function generateMetadata({ params }: AboutPageProps) {
  const meta = await import("@/lib/seo/metadata");
  return meta.buildLocalizedMetadata({ params, titleKey: "about.title", descriptionKey: "about.subtitle", pathname: `/${params.locale}/${params.country}/about` });
}

export default function AboutPage({ params }: AboutPageProps) {
  const dict = getDictionary(params.locale);
  const basePath = `/${params.locale}/${params.country}`;

  return (
    <main className="bg-brand-rice page-transition">
      <Container>
        {/* Header with Language Switcher */}
        <div className="flex items-center justify-between border-b border-brand-ink/10 py-4">
          <Link href={basePath} className="text-sm font-medium text-brand-ink hover:text-brand-gold transition">
            ← {t(dict, "common.back")}
          </Link>
          <LocaleSwitcher currentLocale={params.locale} variant="inline" />
        </div>
      </Container>

      {/* Hero Section */}
      <Container className="py-10">
        <SectionHero
          eyebrow={t(dict, "nav.about")}
          title={t(dict, "about.title")}
          subtitle={t(dict, "about.subtitle")}
        />
      </Container>

      <section className="border-t border-brand-ink/10">
        <Container className="py-16">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-start">
            <div className="rounded-2xl border border-brand-ink/10 bg-white p-8 shadow-soft">
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-brand-gold">{t(dict, "about.brandStoryTitle")}</p>
              <h2 className="mt-4 text-3xl font-bold text-brand-ink">{t(dict, "about.ourStory.title")}</h2>
              <p className="mt-6 text-base leading-8 text-brand-ink/80">{t(dict, "about.brandStory")}</p>
              <p className="mt-4 text-sm leading-7 text-brand-ink/70">{t(dict, "about.ourStory.content")}</p>
              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl bg-brand-obsidian/30 p-4">
                  <p className="text-xs uppercase tracking-[0.25em] text-brand-ink/40">{t(dict, "about.labels.mission")}</p>
                  <p className="mt-2 text-sm text-brand-ink/75">{t(dict, "about.storyHighlights.ingredient")}</p>
                </div>
                <div className="rounded-xl bg-brand-obsidian/30 p-4">
                  <p className="text-xs uppercase tracking-[0.25em] text-brand-ink/40">{t(dict, "about.labels.values")}</p>
                  <p className="mt-2 text-sm text-brand-ink/75">{t(dict, "about.storyHighlights.craft")}</p>
                </div>
                <div className="rounded-xl bg-brand-obsidian/30 p-4">
                  <p className="text-xs uppercase tracking-[0.25em] text-brand-ink/40">{t(dict, "about.team.title")}</p>
                  <p className="mt-2 text-sm text-brand-ink/75">{t(dict, "about.storyHighlights.service")}</p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-2xl border border-brand-gold/10 bg-brand-obsidian p-8">
                <p className="text-xs font-semibold uppercase tracking-[0.35em] text-brand-gold/80">{t(dict, "about.missionTitle")}</p>
                <h3 className="mt-4 text-2xl font-semibold text-brand-ink">{t(dict, "about.mission.title")}</h3>
                <p className="mt-4 text-sm leading-7 text-brand-ink/75">{t(dict, "about.missionStatement")}</p>
              </div>

              <div className="rounded-2xl border border-brand-ink/10 bg-white p-8 shadow-soft">
                <p className="text-xs font-semibold uppercase tracking-[0.35em] text-brand-gold">{t(dict, "about.valuesTitle")}</p>
                <h3 className="mt-4 text-2xl font-semibold text-brand-ink">{t(dict, "about.values.title")}</h3>
                <ul className="mt-4 space-y-3">
                  <li className="rounded-xl bg-brand-obsidian/30 p-4 text-sm leading-7 text-brand-ink/75">{t(dict, "about.values.quality")}</li>
                  <li className="rounded-xl bg-brand-obsidian/30 p-4 text-sm leading-7 text-brand-ink/75">{t(dict, "about.values.sustainability")}</li>
                  <li className="rounded-xl bg-brand-obsidian/30 p-4 text-sm leading-7 text-brand-ink/75">{t(dict, "about.values.community")}</li>
                  <li className="rounded-xl bg-brand-obsidian/30 p-4 text-sm leading-7 text-brand-ink/75">{t(dict, "about.values.excellence")}</li>
                </ul>
              </div>
            </div>
          </div>
        </Container>
      </section>

      <section className="border-t border-brand-ink/10 bg-brand-obsidian">
        <Container className="py-16">
          <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-2xl border border-brand-gold/10 bg-white/5 p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-brand-gold/80">{t(dict, "about.positioningTitle")}</p>
              <h3 className="mt-4 text-2xl font-semibold text-brand-ink">{t(dict, "about.title")}</h3>
              <p className="mt-4 text-sm leading-8 text-brand-ink/75">{t(dict, "about.positioning")}</p>
            </div>

            <div className="rounded-2xl border border-brand-gold/10 bg-white/5 p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-brand-gold/80">{t(dict, "about.experienceTitle")}</p>
              <p className="mt-4 text-sm leading-7 text-brand-ink/75">{t(dict, "about.experienceSubtitle")}</p>
              <Link
                href={`${basePath}/menu`}
                className="mt-6 inline-block rounded-full bg-brand-gold px-6 py-3 text-sm font-semibold text-black transition hover:shadow-soft"
              >
                {t(dict, "nav.menu")}
              </Link>
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}
