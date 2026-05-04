"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Container from "@/components/layout/Container";
import ImageWrapper from "@/components/ui/ImageWrapper";

type CinematicHeroProps = {
  locale: string;
  country: string;
};

const heroBlur =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNCIgaGVpZ2h0PSI0IiB2aWV3Qm94PSIwIDAgNCA0IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSI0IiBoZWlnaHQ9IjQiIGZpbGw9IiMxMTExMTEiLz48L3N2Zz4=";

export default function CinematicHero({ locale, country }: CinematicHeroProps) {
  const [offset, setOffset] = useState(0);
  const heroImages = useMemo(
    () => [
      "/building_pics/charme_restaurant-building.jpg",
      "/building_pics/charme_restaurant-building1.jpg",
      "/building_pics/charme_restaurant-building2.jpg",
      "/building_pics/charme_restaurant-building3.jpg",
      "/building_pics/charme_restaurant-building4.jpg",
      "/building_pics/charme_restaurant-building5.jpg",
      "/building_pics/charme_restaurant-ambiance1.jpg",
      "/building_pics/charme-restaurant1.jpg",
      "/building_pics/Dining.jpg",
      "/building_pics/Dining1.jpg",
      "/building_pics/Dining2.jpg",
      "/building_pics/Dining3.jpg",
      "/building_pics/Dining4.jpg",
      "/building_pics/Dining5.jpg",
      "/building_pics/Dining6.jpg",
      "/building_pics/dining7.jpg",
      "/building_pics/dining8.jpg",
      "/building_pics/dining9.jpg",
      "/building_pics/dining10.jpg",
      "/building_pics/dining11.jpg",
      "/building_pics/charme-supermarket8.jpg",
      "/building_pics/feelingIron-plate-shrimps.jpg"
    ],
    []
  );
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    let frame = 0;

    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        setOffset(Math.min(28, window.scrollY * 0.16));
        frame = 0;
      });
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => {
    if (heroImages.length === 0) return;

    const interval = window.setInterval(() => {
      setActiveIndex((current) => getNextSequentialIndex(current, heroImages.length));
    }, 5000);

    return () => window.clearInterval(interval);
  }, [heroImages.length]);

  return (
    <section className="relative min-h-[100svh] overflow-hidden bg-brand-obsidian text-brand-ink">
      <div
        className="absolute inset-0 transition-transform duration-700"
        style={{ transform: `translate3d(0, ${offset}px, 0)` }}
      >
        {heroImages.map((src, index) => (
          <div
            key={src}
            className={`hero-slide absolute inset-0 ${
              index === activeIndex ? "hero-slide-active" : "hero-slide-inactive"
            }`}
          >
            <ImageWrapper
              src={src}
              alt="Charme building ambience"
              sizes="100vw"
              priority={index === 0}
              blurDataURL={heroBlur}
              className="h-full w-full"
              imageClassName="image-focus"
              objectPositionClassName={getHeroObjectPosition(src)}
            />
          </div>
        ))}
      </div>
      <div className="pointer-events-none absolute inset-0 hero-vignette opacity-70" />
      <div className="absolute inset-0 opacity-40">
        <div className="absolute -left-20 top-10 h-64 w-64 rounded-full bg-brand-gold/10 blur-3xl" />
        <div className="absolute right-0 top-1/3 h-72 w-72 rounded-full bg-brand-jade/20 blur-3xl" />
      </div>
      <div className="pointer-events-none absolute inset-0 animate-drift opacity-40">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(201,169,110,0.24),transparent_35%),radial-gradient(circle_at_80%_30%,rgba(255,255,255,0.08),transparent_40%),radial-gradient(circle_at_50%_80%,rgba(201,169,110,0.12),transparent_45%)]" />
      </div>
      <Container>
        <div className="relative flex min-h-[100svh] items-center py-20">
          <div className="glass-card w-full max-w-2xl rounded-3xl px-8 py-12 sm:px-12 sm:py-14 animate-rise-in">
            <p className="text-xs uppercase tracking-[0.4em] text-brand-gold/80">
              Charme Restaurant
            </p>
            <h1 className="mt-5 font-display text-4xl text-brand-ink sm:text-5xl lg:text-6xl">
              Charme
            </h1>
            <p className="mt-4 text-base text-brand-ink/80 sm:text-lg">
              Authentic Taste. Timeless Experience.
            </p>
            <p className="mt-6 text-sm text-brand-ink/70 sm:text-base">
              An intimate Chinese and Taiwanese dining room with curated tasting menus,
              ceremonial tea, and premium groceries.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href={`/${locale}/${country}/menu`}
                className="btn btn-gold shadow-soft hover:translate-y-[-1px]"
              >
                View Menu
              </Link>
              <Link
                href={`/${locale}/${country}/checkout`}
                className="btn btn-outline hover:bg-brand-gold/10"
              >
                Order Now
              </Link>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

function getNextSequentialIndex(currentIndex: number, length: number) {
  if (length <= 1) return currentIndex;
  return (currentIndex + 1) % length;
}

function getHeroObjectPosition(path: string) {
  const lower = path.toLowerCase();
  if (lower.includes("soup") || lower.includes("noodle") || lower.includes("bowl")) {
    return "object-top";
  }
  return "object-center";
}
