import Link from "next/link";
import Container from "@/components/layout/Container";
import SectionHero from "@/components/sections/SectionHero";
import LocaleSwitcher from "@/components/navigation/LocaleSwitcher";
import { env } from "@/lib/env";
import { getDictionary, t } from "@/lib/i18n";

interface LocationsPageProps {
  params: { locale: string; country: string };
}

const locationCards = [
  {
    id: 1,
    cityKey: "locations.cities.abuja",
    branchKey: "locations.branches.abujaMaitama.name",
    addressKey: "locations.branches.abujaMaitama.address",
    addressShortKey: "locations.branches.abujaMaitama.addressShort",
    weekdayHoursKey: "locations.branches.abujaMaitama.hoursWeekday",
    weekendHoursKey: "locations.branches.abujaMaitama.hoursWeekend",
    mapsLabelKey: "locations.branches.abujaMaitama.googleMapsLabel",
    phone: "+234 811 120 2666",
    email: "abuja@charme-restaurant.com",
    mapsUrl: "https://maps.google.com/?q=No.+41+Gana+Street,+Maitama,+Abuja,+Nigeria"
  }
];

export async function generateMetadata({ params }: LocationsPageProps) {
  const meta = await import("@/lib/seo/metadata");
  return meta.buildLocalizedMetadata({ params, titleKey: "locations.title", descriptionKey: "locations.description", pathname: `/${params.locale}/${params.country}/locations` });
}

export default function LocationsPage({ params }: LocationsPageProps) {
  const dict = getDictionary(params.locale);
  const basePath = `/${params.locale}/${params.country}`;
  const location = locationCards[0];
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    name: t(dict, location.branchKey),
    url: `${env.NEXTAUTH_URL.replace(/\/$/, "")}${basePath}/locations`,
    hasMap: location.mapsUrl,
    telephone: location.phone,
    address: {
      "@type": "PostalAddress",
      streetAddress: t(dict, location.addressKey),
      addressLocality: "Maitama",
      addressRegion: "Abuja Federal Capital Territory",
      addressCountry: "NG"
    },
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
        opens: "09:00",
        closes: "21:00"
      }
    ]
  };

  return (
    <main className="bg-brand-rice page-transition">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
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
          eyebrow={t(dict, "nav.locations")}
          title={t(dict, "locations.title")}
          subtitle={t(dict, "locations.description")}
        />
      </Container>

      {/* Locations Grid */}
      <section className="border-t border-brand-ink/10">
        <Container className="py-16">
          {locationCards.length === 0 ? (
            <div className="rounded-2xl border border-brand-ink/10 bg-white p-8 text-center">
              <p className="text-brand-ink/60">{t(dict, "locations.noLocations")}</p>
            </div>
          ) : (
            <div className="mx-auto grid max-w-3xl gap-8">
              {locationCards.map((location) => (
                <div
                  key={location.id}
                  className="overflow-hidden rounded-2xl border border-brand-ink/10 bg-white shadow-soft transition hover:shadow-crisp hover:border-brand-gold/20"
                >
                  {/* Location Header */}
                  <div className="border-b border-brand-ink/10 bg-brand-obsidian/50 p-6">
                    <div className="inline-block rounded-full bg-brand-gold px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-black">
                      {t(dict, location.cityKey)}
                    </div>
                    <h3 className="mt-3 text-xl font-semibold text-brand-ink">
                      {t(dict, location.branchKey)}
                    </h3>
                    <p className="mt-2 text-sm text-brand-ink/60">{t(dict, location.addressKey)}</p>
                  </div>

                  {/* Contact Information */}
                  <div className="space-y-4 p-6">
                    {/* Address */}
                    <div>
                      <p className="text-xs uppercase tracking-wide text-brand-ink/50">{t(dict, "common.address")}</p>
                      <p className="mt-1 text-sm leading-6 text-brand-ink">{t(dict, location.addressKey)}</p>
                      <p className="mt-1 text-xs text-brand-ink/50">{t(dict, location.addressShortKey)}</p>
                    </div>

                    {/* Phone */}
                    <div>
                      <p className="text-xs uppercase tracking-wide text-brand-ink/50">{t(dict, "common.phone")}</p>
                      <a
                        href={`tel:${location.phone}`}
                        className="mt-1 text-sm font-medium text-brand-gold hover:text-brand-gold/80 transition"
                      >
                        {location.phone}
                      </a>
                    </div>

                    {/* Email */}
                    <div>
                      <p className="text-xs uppercase tracking-wide text-brand-ink/50">{t(dict, "common.email")}</p>
                      <a
                        href={`mailto:${location.email}`}
                        className="mt-1 text-sm font-medium text-brand-gold hover:text-brand-gold/80 transition"
                      >
                        {location.email}
                      </a>
                    </div>

                    {/* Hours */}
                    <div>
                      <p className="text-xs uppercase tracking-wide text-brand-ink/50">{t(dict, "common.hours")}</p>
                      <p className="mt-1 text-sm leading-6 text-brand-ink">{t(dict, location.weekdayHoursKey)}</p>
                      <p className="mt-1 text-sm leading-6 text-brand-ink/70">{t(dict, location.weekendHoursKey)}</p>
                    </div>

                    {/* Features */}
                    <div className="border-t border-brand-ink/10 pt-4">
                      <div className="flex flex-wrap gap-2">
                        <span className="rounded-full bg-brand-ink/5 px-3 py-1 text-xs font-medium text-brand-ink">{t(dict, "locations.info.dineIn")}</span>
                        <span className="rounded-full bg-brand-ink/5 px-3 py-1 text-xs font-medium text-brand-ink">{t(dict, "locations.info.takeaway")}</span>
                        <span className="rounded-full bg-brand-ink/5 px-3 py-1 text-xs font-medium text-brand-ink">{t(dict, "locations.info.delivery")}</span>
                        <span className="rounded-full bg-brand-ink/5 px-3 py-1 text-xs font-medium text-brand-ink">{t(dict, "locations.info.openDaily")}</span>
                      </div>
                    </div>
                  </div>

                  {/* CTA Buttons */}
                  <div className="border-t border-brand-ink/10 bg-brand-rice p-4 flex gap-2">
                    <a
                      href={location.mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 rounded-lg border border-brand-ink/20 px-3 py-2 text-center text-xs font-semibold text-brand-ink hover:border-brand-gold hover:bg-brand-gold/10 transition"
                    >
                      {t(dict, location.mapsLabelKey)}
                    </a>
                    <button className="flex-1 rounded-lg bg-brand-ink px-3 py-2 text-center text-xs font-semibold text-white hover:bg-brand-ink/90 transition">
                      {t(dict, "locations.makeReservation")}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Container>
      </section>

      {/* CTA Section */}
      <section className="border-t border-brand-ink/10 bg-brand-obsidian">
        <Container className="py-12">
          <div className="rounded-2xl border border-brand-gold/10 bg-white/5 p-8 text-center">
            <h2 className="text-2xl font-semibold text-brand-ink">{t(dict, "locations.ctaTitle")}</h2>
            <p className="mt-3 text-brand-ink/70">{t(dict, "locations.ctaSubtitle")}</p>
            <a
              href={`mailto:charme.aid@gmail.com`}
              className="mt-6 inline-block rounded-full bg-brand-gold px-6 py-3 text-sm font-semibold text-black transition hover:shadow-soft"
            >
              {t(dict, "common.contactUs")}
            </a>
          </div>
        </Container>
      </section>
    </main>
  );
}
