import Link from "next/link";
import CinematicHero from "@/components/hero/CinematicHero";
import Container from "@/components/layout/Container";
import { images } from "@/config/images";
import ImageWrapper from "@/components/ui/ImageWrapper";
import { getDictionary, t } from "@/lib/i18n";

const blurData =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNCIgaGVpZ2h0PSI0IiB2aWV3Qm94PSIwIDAgNCA0IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSI0IiBoZWlnaHQ9IjQiIGZpbGw9IiMxMTExMTEiLz48L3N2Zz4=";

export default function HomePage({
  params
}: {
  params: { locale: string; country: string };
}) {
  const dict = getDictionary(params.locale);

  return (
    <main className="page-transition">
      <CinematicHero locale={params.locale} country={params.country} />

      <section className="section-fade bg-brand-obsidian py-24">
        <Container>
          <div className="space-y-8">
            <div className="max-w-2xl">
              <p className="seal-badge">{t(dict, "home.signature.eyebrow")}</p>
              <h2 className="mt-4 text-2xl text-brand-ink sm:text-3xl lg:text-4xl">
                {t(dict, "home.signature.title")}
              </h2>
              <p className="mt-4 text-sm text-brand-ink/70 sm:text-base">
                {t(dict, "home.signature.subtitle")}
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
              {signatureCards.map((card) => (
                <article
                  key={card.titleKey}
                  className="group overflow-hidden rounded-3xl border border-brand-gold/10 bg-black/40 shadow-crisp transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_70px_rgba(0,0,0,0.45)]"
                >
                  <ImageWrapper
                    src={card.imageUrl}
                    alt={t(dict, card.titleKey)}
                    aspect="square"
                    sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 25vw"
                    blurDataURL={blurData}
                    className="w-full"
                    imageClassName="image-zoom image-focus transition duration-500 ease-out group-hover:scale-[1.06]"
                    objectPositionClassName={card.objectPosition}
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                    <div className="absolute inset-0 bg-brand-gold/10 mix-blend-soft-light" />
                    <div className="absolute bottom-0 left-0 right-0 p-5">
                      <p className="text-xs uppercase tracking-[0.3em] text-brand-gold/80">
                        {t(dict, "home.signature.eyebrow")}
                      </p>
                      <h3 className="mt-2 font-display text-xl text-brand-ink">{t(dict, card.titleKey)}</h3>
                      <p className="mt-2 text-sm text-brand-ink/70">{t(dict, card.descriptionKey)}</p>
                    </div>
                  </ImageWrapper>
                </article>
              ))}
            </div>

            <div>
              <Link
                href={`/${params.locale}/${params.country}/menu`}
                className="btn btn-gold"
              >
                {t(dict, "home.hero.primaryCta")}
              </Link>
            </div>
          </div>
        </Container>
      </section>

      <section className="section-fade bg-brand-obsidian py-24">
        <Container>
          <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="relative overflow-hidden rounded-3xl border border-brand-gold/10 bg-black/40 shadow-crisp">
              <ImageWrapper
                src="/tea&iced-cream/gelato.jpg"
                alt={t(dict, "home.dining.title")}
                sizes="(max-width: 1024px) 100vw, 700px"
                blurDataURL={blurData}
                className="absolute inset-0 h-full w-full"
                imageClassName="image-zoom image-focus"
              />
            </div>
            <div className="flex flex-col justify-center rounded-3xl border border-brand-gold/10 bg-black/40 p-8 shadow-crisp">
              <p className="seal-badge">{t(dict, "home.dining.eyebrow")}</p>
              <h2 className="mt-4 text-2xl text-brand-ink sm:text-3xl">
                {t(dict, "home.dining.title")}
              </h2>
              <p className="mt-4 text-sm text-brand-ink/70 sm:text-base">
                {t(dict, "home.dining.subtitle")}
              </p>
              <p className="mt-4 text-sm text-brand-ink/70 sm:text-base">
                {t(dict, "home.dining.story")}
              </p>
              <div className="mt-6 gold-divider" />
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href={`/${params.locale}/${params.country}/menu`} className="btn btn-gold">
                  {t(dict, "home.dining.primaryCta")}
                </Link>
                <Link href={`/${params.locale}/${params.country}/locations`} className="btn btn-outline hover:bg-brand-gold/10">
                  {t(dict, "home.dining.secondaryCta")}
                </Link>
              </div>
              <p className="mt-6 text-xs uppercase tracking-[0.3em] text-brand-gold/70">
                {t(dict, "home.dining.note")}
              </p>
            </div>
          </div>
        </Container>
      </section>

      <section className="section-fade bg-brand-obsidian py-24">
        <Container>
          <div className="relative overflow-hidden rounded-3xl border border-brand-gold/10 bg-black/60 shadow-crisp">
            <div className="grid min-h-[320px] gap-px bg-brand-gold/10 lg:grid-cols-2">
              <div className="group relative overflow-hidden bg-black/50">
                <ImageWrapper
                  src={images.dining}
                  alt="Restaurant dining"
                  sizes="(max-width: 1024px) 100vw, 700px"
                  blurDataURL={blurData}
                  className="absolute inset-0 h-full w-full"
                  imageClassName="transition duration-500 ease-out group-hover:scale-[1.05]"
                  overlayClassName="from-black/75 via-black/55 to-black/30"
                />
              </div>
              <div className="group relative overflow-hidden bg-black/50">
                <ImageWrapper
                  src="/images/Take-away.jpg"
                  alt="Supermarket shelves"
                  sizes="(max-width: 1024px) 100vw, 700px"
                  blurDataURL={blurData}
                  className="absolute inset-0 h-full w-full"
                  imageClassName="transition duration-500 ease-out group-hover:scale-[1.05]"
                  overlayClassName="from-black/75 via-black/55 to-black/30"
                />
              </div>
            </div>
            <div className="pointer-events-none absolute inset-y-0 left-1/2 hidden w-px bg-gradient-to-b from-transparent via-brand-gold/50 to-transparent shadow-[0_0_24px_rgba(212,175,55,0.35)] lg:block" />
            <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 py-12 text-center">
              <p className="seal-badge">{t(dict, "home.market.eyebrow")}</p>
              <h2 className="mt-4 text-2xl text-brand-ink sm:text-3xl lg:text-4xl">
                {t(dict, "home.market.title")}
              </h2>
              <p className="mt-4 max-w-2xl text-sm text-brand-ink/70 sm:text-base">
                {t(dict, "home.market.subtitle")}
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href={`/${params.locale}/${params.country}/menu`}
                  className="btn btn-gold"
                >
                  {t(dict, "home.market.primaryCta")}
                </Link>
                <Link
                  href={`/${params.locale}/${params.country}/market`}
                  className="btn btn-outline hover:bg-brand-gold/10"
                >
                  {t(dict, "home.market.secondaryCta")}
                </Link>
              </div>
            </div>
          </div>
        </Container>
      </section>

      <section className="section-fade bg-brand-obsidian py-24">
        <Container>
          <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="grid grid-cols-2 gap-4 rounded-3xl border border-brand-gold/10 bg-black/40 p-4 shadow-crisp sm:p-5">
              {images.teaGallery.map((src, index) => (
                <div
                  key={src}
                  className={`group relative overflow-hidden rounded-2xl bg-black/50 ${index === 0 ? "row-span-2 min-h-[320px]" : "min-h-[150px]"}`}
                >
                  <ImageWrapper
                    src={src}
                    alt={t(dict, "home.tea.title")}
                    sizes={index === 0 ? "(max-width: 1024px) 100vw, 50vw" : "(max-width: 1024px) 50vw, 25vw"}
                    blurDataURL={blurData}
                    className="absolute inset-0 h-full w-full"
                    imageClassName="image-zoom image-focus transition duration-500 ease-out group-hover:scale-[1.05]"
                    overlayClassName="from-black/55 via-black/20 to-transparent"
                  />
                </div>
              ))}
            </div>

            <div className="flex flex-col justify-center rounded-3xl border border-brand-gold/10 bg-black/40 p-8 shadow-crisp">
              <p className="seal-badge">{t(dict, "home.tea.title")}</p>
              <h2 className="mt-4 text-2xl text-brand-ink sm:text-3xl">
                {t(dict, "home.tea.title")}
              </h2>
              <p className="mt-4 text-sm text-brand-ink/70 sm:text-base">
                {t(dict, "home.tea.subtitle")}
              </p>
              <div className="mt-6 gold-divider" />
              <p className="mt-6 text-xs uppercase tracking-[0.3em] text-brand-gold/70">
                {t(dict, "home.dining.note")}
              </p>
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}

export async function generateMetadata({ params }: { params: { locale: string; country: string } }) {
  const meta = await import("@/lib/seo/metadata");
  return meta.buildLocalizedMetadata({ params, titleKey: "brand.tagline", descriptionKey: "brand.description", pathname: `/${params.locale}/${params.country}` });
}

const signatureCards = [
  {
    titleKey: "home.signature.cards.dumplings.title",
    descriptionKey: "home.signature.cards.dumplings.description",
    imageUrl: images.menu.dumplings,
    objectPosition: "object-center"
  },
  {
    titleKey: "home.signature.cards.noodles.title",
    descriptionKey: "home.signature.cards.noodles.description",
    imageUrl: images.menu.noodles,
    objectPosition: "object-top"
  },
  {
    titleKey: "home.signature.cards.rice.title",
    descriptionKey: "home.signature.cards.rice.description",
    imageUrl: images.menu.rice,
    objectPosition: "object-center"
  },
  {
    titleKey: "home.signature.cards.duck.title",
    descriptionKey: "home.signature.cards.duck.description",
    imageUrl: images.menu.duck,
    objectPosition: "object-center"
  }
];
