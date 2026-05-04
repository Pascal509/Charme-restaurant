import Image from "next/image";
import { forwardRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type ImageWrapperProps = {
  src?: string | null;
  alt: string;
  aspect?: "menu" | "hero" | "market" | "square" | "tall";
  sizes?: string;
  priority?: boolean;
  className?: string;
  imageClassName?: string;
  overlayClassName?: string;
  objectPositionClassName?: string;
  showOverlay?: boolean;
  blurDataURL?: string;
  children?: ReactNode;
  fallbackLabel?: string;
};

const shimmerDataUrl =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGxpbmVhckdyYWRpZW50IGlkPSJnIiB4MT0iMCIgeTE9IjAiIHgyPSIxIiB5Mj0iMSI+PHN0b3Agb2Zmc2V0PSIwJSIgc3RvcC1jb2xvcj0iIzE1MTUxNSIvPjxzdG9wIG9mZnNldD0iNTAlIiBzdG9wLWNvbG9yPSIjMjIyIi8+PHN0b3Agb2Zmc2V0PSIxMDAlIiBzdG9wLWNvbG9yPSIjMTUxNTE1Ii8+PC9saW5lYXJHcmFkaWVudD48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0idXJsKCNnKSIvPjwvc3ZnPg==";

const ImageWrapper = forwardRef<HTMLDivElement, ImageWrapperProps>(function ImageWrapper(
  {
    src,
    alt,
    aspect = "hero",
    sizes,
    priority,
    className,
    imageClassName,
    overlayClassName,
    objectPositionClassName,
    showOverlay = true,
    blurDataURL,
    children,
    fallbackLabel = "Image unavailable"
  },
  ref
) {
  const aspectClass = (() => {
    if (aspect === "menu") return "aspect-[4/3]";
    if (aspect === "market" || aspect === "square") return "aspect-square";
    if (aspect === "tall") return "aspect-[4/5]";
    return "aspect-[16/9]";
  })();

  return (
    <div
      ref={ref}
      className={cn(
        "relative overflow-hidden rounded-2xl bg-brand-ink/5",
        aspectClass,
        className
      )}
    >
      {src ? (
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          className={cn(
            "object-cover object-center brightness-90 contrast-[1.05] saturate-[0.95]",
            objectPositionClassName,
            imageClassName
          )}
          placeholder="blur"
          blurDataURL={blurDataURL ?? shimmerDataUrl}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-xs text-brand-ink/60">
          {fallbackLabel}
        </div>
      )}
      {showOverlay ? (
        <>
          <div
            className={cn(
              "absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent",
              overlayClassName
            )}
          />
          <div className="absolute inset-0 bg-brand-gold/10 mix-blend-soft-light" />
        </>
      ) : null}
      {children ? <div className="relative z-10 h-full w-full">{children}</div> : null}
    </div>
  );
});

export default ImageWrapper;
