import Link from "next/link";
import Image from "next/image";
import Container from "@/components/layout/Container";
import DesktopNav from "@/components/navigation/DesktopNav";
import MobileNav from "@/components/navigation/MobileNav";

export default function SiteShell({
  children,
  locale,
  country
}: {
  children: React.ReactNode;
  locale: string;
  country: string;
}) {
  return (
    <div className="min-h-screen bg-brand-rice text-brand-ink page-transition">
      <header className="border-b border-brand-gold/10 bg-brand-obsidian/85 backdrop-blur-lg">
        <Container className="flex items-center justify-between py-5">
          <DesktopNav locale={locale} country={country} />
          <MobileNav locale={locale} country={country} />
        </Container>
      </header>
      {children}
      <footer className="border-t border-brand-gold/10 bg-brand-obsidian py-14 text-brand-ink animate-fade-in">
        <Container>
          <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr_1fr_1fr_1fr]">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="relative h-10 w-10 overflow-hidden rounded-full border border-brand-gold/30">
                  <Image
                    src="/icons/charme-logo.jpg"
                    alt="Charme logo"
                    fill
                    sizes="40px"
                    className="object-cover"
                  />
                </div>
                <h3 className="text-xl text-brand-ink">Charme</h3>
              </div>
              <p className="text-sm text-brand-ink/70">
                Authentic Chinese & Taiwanese cuisine with a curated Asian market.
              </p>
            </div>

            <div className="space-y-3 text-sm">
              <p className="text-xs uppercase tracking-[0.3em] text-brand-gold/70">Navigation</p>
              <div className="flex flex-col gap-2">
                <Link
                  href={`/${locale}/${country}`}
                  className="text-brand-ink/70 transition hover:text-brand-gold"
                >
                  Home
                </Link>
                <Link
                  href={`/${locale}/${country}/menu`}
                  className="text-brand-ink/70 transition hover:text-brand-gold"
                >
                  Menu
                </Link>
                <Link
                  href={`/${locale}/${country}/market`}
                  className="text-brand-ink/70 transition hover:text-brand-gold"
                >
                  Market
                </Link>
                <Link
                  href={`/${locale}/${country}/orders`}
                  className="text-brand-ink/70 transition hover:text-brand-gold"
                >
                  Orders
                </Link>
              </div>
            </div>

            <div className="space-y-3 text-sm">
              <p className="text-xs uppercase tracking-[0.3em] text-brand-gold/70">Contact</p>
              <div className="space-y-2 text-brand-ink/70">
                <p>12 Lantern Way, Abuja, Nigeria</p>
                <p>+234 800 000 0000</p>
                <p>hello@charme.ng</p>
              </div>
            </div>

            <div className="space-y-3 text-sm">
              <p className="text-xs uppercase tracking-[0.3em] text-brand-gold/70">Hours</p>
              <div className="space-y-2 text-brand-ink/70">
                <p className="text-xs uppercase tracking-[0.2em] text-brand-ink/50">Restaurant</p>
                <p>Mon–Fri: 11:00 – 22:30</p>
                <p>Sat–Sun: 12:00 – 23:00</p>
                <p className="pt-2 text-xs uppercase tracking-[0.2em] text-brand-ink/50">Market</p>
                <p>Daily: 9:00 – 21:00</p>
              </div>
            </div>

            <div className="space-y-3 text-sm">
              <p className="text-xs uppercase tracking-[0.3em] text-brand-gold/70">Social</p>
              <div className="flex flex-col gap-2">
                <a
                  href="https://instagram.com"
                  className="text-brand-ink/70 transition hover:text-brand-gold"
                  target="_blank"
                  rel="noreferrer"
                >
                  Instagram
                </a>
                <a
                  href="https://x.com"
                  className="text-brand-ink/70 transition hover:text-brand-gold"
                  target="_blank"
                  rel="noreferrer"
                >
                  Twitter (X)
                </a>
              </div>
            </div>
          </div>

          <div className="mt-10 border-t border-brand-gold/10 pt-6 text-xs text-brand-ink/60">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p>© 2026 Charme Restaurant & Supermarket</p>
              <p>Authentic Chinese & Taiwanese Cuisine</p>
            </div>
          </div>
        </Container>
      </footer>
    </div>
  );
}
