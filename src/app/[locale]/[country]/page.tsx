import Link from "next/link";
import CinematicHero from "@/components/hero/CinematicHero";
import Container from "@/components/layout/Container";
import ParallaxImageSection from "@/components/sections/ParallaxImageSection";
import { images } from "@/config/images";
import ImageWrapper from "@/components/ui/ImageWrapper";

const blurData =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNCIgaGVpZ2h0PSI0IiB2aWV3Qm94PSIwIDAgNCA0IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSI0IiBoZWlnaHQ9IjQiIGZpbGw9IiMxMTExMTEiLz48L3N2Zz4=";

export default function HomePage({
  params
}: {
  params: { locale: string; country: string };
}) {
  return (
    <main className="page-transition">
      <CinematicHero locale={params.locale} country={params.country} />

      <section className="section-fade bg-brand-obsidian py-24">
        <Container>
          <div className="space-y-8">
            <div className="max-w-2xl">
              <p className="seal-badge">Chef&apos;s Specials</p>
              <h2 className="mt-4 text-2xl text-brand-ink sm:text-3xl lg:text-4xl">
                Chef&apos;s Signature Dishes
              </h2>
              <p className="mt-4 text-sm text-brand-ink/70 sm:text-base">
                A curated set of refined dishes that show the depth, warmth, and precision of
                the kitchen.
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
              {signatureCards.map((card) => (
                <article
                  key={card.title}
                  className="group overflow-hidden rounded-3xl border border-brand-gold/10 bg-black/40 shadow-crisp transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_70px_rgba(0,0,0,0.45)]"
                >
                  <ImageWrapper
                    src={card.imageUrl}
                    alt={card.title}
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
                        Chef&apos;s Experience
                      </p>
                      <h3 className="mt-2 font-display text-xl text-brand-ink">{card.title}</h3>
                      <p className="mt-2 text-sm text-brand-ink/70">{card.description}</p>
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
                View Menu
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
                src={images.dining}
                alt="Authentic Dining Experience"
                sizes="(max-width: 1024px) 100vw, 700px"
                blurDataURL={blurData}
                className="absolute inset-0 h-full w-full"
                imageClassName="image-zoom image-focus"
              />
            </div>
            <div className="flex flex-col justify-center rounded-3xl border border-brand-gold/10 bg-black/40 p-8 shadow-crisp">
              <p className="seal-badge">Authentic Dining Experience</p>
              <h2 className="mt-4 text-2xl text-brand-ink sm:text-3xl">
                Tradition, ambiance, and calm luxury
              </h2>
              <p className="mt-4 text-sm text-brand-ink/70 sm:text-base">
                Candlelit tables, lacquered wood, and refined service create an atmosphere
                inspired by heritage and designed for celebration.
              </p>
              <div className="mt-6 gold-divider" />
              <p className="mt-6 text-xs uppercase tracking-[0.3em] text-brand-gold/70">
                A place to linger
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
              <p className="seal-badge">Restaurant & Market</p>
              <h2 className="mt-4 text-2xl text-brand-ink sm:text-3xl lg:text-4xl">
                Dine Authentically. Shop Essentials.
              </h2>
              <p className="mt-4 max-w-2xl text-sm text-brand-ink/70 sm:text-base">
                Two experiences under one roof: a refined dining room and a curated Asian
                grocery market.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href={`/${params.locale}/${params.country}/menu`}
                  className="btn btn-gold"
                >
                  Explore Menu
                </Link>
                <Link
                  href={`/${params.locale}/${params.country}/market`}
                  className="btn btn-outline hover:bg-brand-gold/10"
                >
                  Visit Market
                </Link>
              </div>
            </div>
          </div>
        </Container>
      </section>

      <section className="section-fade bg-brand-obsidian py-24">
        <Container>
          <ParallaxImageSection
            title="Tea & Culture"
            subtitle="Ceremonial tea, porcelain artistry, and a gentle ritual that slows the evening."
            imageUrl={images.tea}
          />
        </Container>
      </section>
    </main>
  );
}

const signatureCards = [
  {
    title: "Hand-Folded Dumplings",
    description: "Delicate folds, tender fillings, and a clean steamed finish.",
    imageUrl: images.menu.dumplings,
    objectPosition: "object-center"
  },
  {
    title: "Silken Noodle Bowls",
    description: "Fresh noodles dressed in rich sauce and bright aromatics.",
    imageUrl: images.menu.noodles,
    objectPosition: "object-top"
  },
  {
    title: "Wok-Fried Rice",
    description: "Fragrant rice with a polished, balanced savory profile.",
    imageUrl: images.menu.rice,
    objectPosition: "object-center"
  },
  {
    title: "Crisp Peking Duck",
    description: "A refined signature with crisp skin and deep, lacquered flavor.",
    imageUrl: images.menu.duck,
    objectPosition: "object-center"
  }
];
