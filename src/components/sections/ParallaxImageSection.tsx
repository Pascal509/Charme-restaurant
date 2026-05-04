"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import ImageWrapper from "@/components/ui/ImageWrapper";

type ParallaxImageSectionProps = {
  title: string;
  subtitle?: string;
  imageUrl: string;
  className?: string;
};

const blurData =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNCIgaGVpZ2h0PSI0IiB2aWV3Qm94PSIwIDAgNCA0IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSI0IiBoZWlnaHQ9IjQiIGZpbGw9IiMxMTExMTEiLz48L3N2Zz4=";

export default function ParallaxImageSection({
  title,
  subtitle,
  imageUrl,
  className
}: ParallaxImageSectionProps) {
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        setOffset(Math.min(40, window.scrollY * 0.12));
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

  return (
    <section
      className={cn(
        "section-fade group relative overflow-hidden rounded-3xl border border-brand-gold/10 bg-black/40 shadow-crisp",
        className
      )}
    >
      <div
        className="absolute inset-0 transition-transform duration-700"
        style={{ transform: `translate3d(0, ${offset}px, 0)` }}
      >
        <ImageWrapper
          src={imageUrl}
          alt={title}
          sizes="100vw"
          blurDataURL={blurData}
          className="h-full w-full"
          imageClassName="image-focus"
        />
      </div>
      <div className="relative z-10 px-8 py-20 text-center sm:px-12">
        <p className="seal-badge mx-auto">Dining Experience</p>
        <h2 className="mt-4 text-2xl text-brand-ink sm:text-3xl lg:text-4xl">
          {title}
        </h2>
        {subtitle ? (
          <p className="mx-auto mt-4 max-w-2xl text-sm text-brand-ink/70 sm:text-base">
            {subtitle}
          </p>
        ) : null}
      </div>
    </section>
  );
}
