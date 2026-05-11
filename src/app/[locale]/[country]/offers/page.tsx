import Link from "next/link";
import Container from "@/components/layout/Container";
import SectionHero from "@/components/sections/SectionHero";
import LocaleSwitcher from "@/components/navigation/LocaleSwitcher";
import { getDictionary, t } from "@/lib/i18n";
import Card from "@/components/ui/Card";
import EmptyState from "@/components/ui/EmptyState";

interface OffersPageProps {
  params: { locale: string; country: string };
}

const offerCards = [
  {
    id: 1,
    badgeKey: "offers.badges.limitedTime",
    titleKey: "offers.cards.brunch.title",
    descriptionKey: "offers.cards.brunch.description",
    detailsKey: "offers.cards.brunch.details",
    minOrder: 48000
  },
  {
    id: 2,
    badgeKey: "offers.badges.popular",
    titleKey: "offers.cards.family.title",
    descriptionKey: "offers.cards.family.description",
    detailsKey: "offers.cards.family.details",
    minOrder: 76000
  },
  {
    id: 3,
    badgeKey: "offers.badges.chefsSpecial",
    titleKey: "offers.cards.tasting.title",
    descriptionKey: "offers.cards.tasting.description",
    detailsKey: "offers.cards.tasting.details",
    minOrder: 125000
  },
  {
    id: 4,
    badgeKey: "offers.badges.limitedTime",
    titleKey: "offers.cards.lunch.title",
    descriptionKey: "offers.cards.lunch.description",
    detailsKey: "offers.cards.lunch.details",
    minOrder: 32000
  }
];

export async function generateMetadata({ params }: OffersPageProps) {
  const meta = await import("@/lib/seo/metadata");
  return meta.buildLocalizedMetadata({ params, titleKey: "offers.title", descriptionKey: "offers.description", pathname: `/${params.locale}/${params.country}/offers` });
}

function formatCurrency(amountMinor: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0
  }).format(amountMinor / 100);
}

export default function OffersPage({ params }: OffersPageProps) {
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
          eyebrow={t(dict, "nav.offers")}
          title={t(dict, "offers.title")}
          subtitle={t(dict, "offers.subtitle")}
        />
      </Container>

      <Container className="pb-4">
        <div className="flex flex-wrap gap-3 text-xs font-semibold uppercase tracking-[0.25em] text-brand-ink/60">
          <span className="rounded-full border border-brand-gold/20 bg-white/60 px-3 py-1">{t(dict, "offers.badges.limitedTime")}</span>
          <span className="rounded-full border border-brand-gold/20 bg-white/60 px-3 py-1">{t(dict, "offers.badges.popular")}</span>
          <span className="rounded-full border border-brand-gold/20 bg-white/60 px-3 py-1">{t(dict, "offers.badges.chefsSpecial")}</span>
        </div>
        <p className="mt-4 max-w-3xl text-sm text-brand-ink/70 sm:text-base">{t(dict, "offers.highlightText")}</p>
      </Container>

      {/* Offers Grid */}
      <section className="border-t border-brand-ink/10">
        <Container className="py-16">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-2">
            {offerCards.length === 0 ? (
              <div className="col-span-full">
                <EmptyState title={t(dict, "offers.noOffers")} subtitle={t(dict, "offers.description")} />
              </div>
            ) : (
              offerCards.map((offer) => (
                <Card key={offer.id} className="p-6 sm:p-7">
                  <div className="flex items-start justify-between gap-4">
                    <span className="rounded-full bg-brand-gold px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-black">
                      {t(dict, offer.badgeKey)}
                    </span>
                    <span className="text-xs font-semibold uppercase tracking-[0.25em] text-brand-ink/40">
                      {t(dict, "offers.minOrder")}:
                      <span className="ml-1"> {formatCurrency(offer.minOrder)}</span>
                    </span>
                  </div>

                  <h3 className="mt-4 text-xl font-semibold text-brand-ink">{t(dict, offer.titleKey)}</h3>
                  <p className="mt-2 text-sm leading-6 text-brand-ink/70">{t(dict, offer.descriptionKey)}</p>
                  <p className="mt-4 text-sm leading-6 text-brand-ink">{t(dict, offer.detailsKey)}</p>

                  <div className="mt-5 rounded-2xl bg-brand-obsidian/40 p-4">
                    <p className="text-xs uppercase tracking-[0.3em] text-brand-gold/80">{t(dict, "offers.appliedAutomatically")}</p>
                    <p className="mt-2 text-sm text-brand-ink/70">{t(dict, "offers.highlightText")}</p>
                  </div>

                  <button className="mt-6 w-full rounded-lg bg-brand-ink px-4 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-brand-ink/90">
                    {t(dict, "common.learnMore")}
                  </button>
                </Card>
              ))
            )}
          </div>
        </Container>
      </section>

      {/* CTA Section */}
      <section className="border-t border-brand-ink/10 bg-brand-obsidian">
        <Container className="py-12">
          <div className="rounded-2xl border border-brand-gold/10 bg-white/5 p-8 text-center">
            <h2 className="text-2xl font-semibold text-brand-ink">{t(dict, "offers.ctaTitle")}</h2>
            <p className="mt-3 text-brand-ink/70">{t(dict, "offers.ctaSubtitle")}</p>
            <Link
              href={`${basePath}/menu`}
              className="mt-6 inline-block rounded-full bg-brand-gold px-6 py-3 text-sm font-semibold text-black transition hover:shadow-soft"
            >
              {t(dict, "offers.ctaMenu")}
            </Link>
            <Link
              href={`mailto:info@charme-restaurant.com`}
              className="mt-6 ml-3 inline-block rounded-full border border-brand-gold/20 px-6 py-3 text-sm font-semibold text-brand-ink transition hover:border-brand-gold/40 hover:bg-white/10"
            >
              {t(dict, "offers.ctaContact")}
            </Link>
          </div>
        </Container>
      </section>
    </main>
  );
}
