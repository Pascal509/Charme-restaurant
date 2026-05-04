import { cn } from "@/lib/utils";
import ImageWrapper from "@/components/ui/ImageWrapper";

type SectionHeroProps = {
  eyebrow: string;
  title: string;
  subtitle?: string;
  imageUrl: string;
  className?: string;
  children?: React.ReactNode;
};

export default function SectionHero({
  eyebrow,
  title,
  subtitle,
  imageUrl,
  className,
  children
}: SectionHeroProps) {
  const blurData =
    "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNCIgaGVpZ2h0PSI0IiB2aWV3Qm94PSIwIDAgNCA0IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSI0IiBoZWlnaHQ9IjQiIGZpbGw9IiMxMTExMTEiLz48L3N2Zz4=";

  return (
    <section
      className={cn(
        "group relative overflow-hidden rounded-3xl border border-brand-gold/10 bg-black/40 shadow-crisp",
        className
      )}
    >
      <ImageWrapper
        src={imageUrl}
        alt={title}
        sizes="(max-width: 768px) 100vw, 1200px"
        blurDataURL={blurData}
        className="absolute inset-0 h-full w-full"
        imageClassName="image-zoom image-focus"
      />
      <div className="relative z-10 px-6 py-10 sm:px-10 sm:py-12">
        <p className="seal-badge">{eyebrow}</p>
        <h1 className="mt-3 font-display text-3xl text-brand-ink sm:text-4xl lg:text-5xl">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-3 max-w-2xl text-sm text-brand-ink/70 sm:text-base">
            {subtitle}
          </p>
        ) : null}
        <div className="mt-6 gold-divider" />
        {children ? <div className="mt-6">{children}</div> : null}
      </div>
    </section>
  );
}
