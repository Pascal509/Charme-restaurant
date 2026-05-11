import Link from "next/link";
import Image from "next/image";
import Container from "@/components/layout/Container";
import DesktopNav from "@/components/navigation/DesktopNav";
import MobileNav from "@/components/navigation/MobileNav";
import { getDictionary, t } from "@/lib/i18n";

export default function SiteShell({
  children,
  locale,
  country
}: {
  children: React.ReactNode;
  locale: string;
  country: string;
}) {
  const dict = getDictionary(locale);

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
                {t(dict, "brand.description")}
              </p>
            </div>

            <div className="space-y-3 text-sm">
              <p className="text-xs uppercase tracking-[0.3em] text-brand-gold/70">{t(dict, "footer.navigation")}</p>
              <div className="flex flex-col gap-2">
                <Link
                  href={`/${locale}/${country}`}
                  className="text-brand-ink/70 transition hover:text-brand-gold"
                >
                  {t(dict, "nav.home")}
                </Link>
                <Link
                  href={`/${locale}/${country}/menu`}
                  className="text-brand-ink/70 transition hover:text-brand-gold"
                >
                  {t(dict, "nav.menu")}
                </Link>
                <Link
                  href={`/${locale}/${country}/market`}
                  className="text-brand-ink/70 transition hover:text-brand-gold"
                >
                  {t(dict, "nav.market")}
                </Link>
                <Link
                  href={`/${locale}/${country}/orders`}
                  className="text-brand-ink/70 transition hover:text-brand-gold"
                >
                  {t(dict, "nav.account")}
                </Link>
              </div>
            </div>

            <div className="space-y-3 text-sm">
              <p className="text-xs uppercase tracking-[0.3em] text-brand-gold/70">{t(dict, "footer.contact")}</p>
              <div className="space-y-2 text-brand-ink/70">
                <a
                  href="https://maps.google.com/?q=No.+41+Gana+Street,+Maitama,+Abuja,+Nigeria"
                  target="_blank"
                  rel="noreferrer"
                  className="block transition hover:text-brand-gold"
                >
                  {t(dict, "footer.address")}
                </a>
                <p className="text-xs text-brand-ink/50">{t(dict, "footer.addressShort")}</p>
                <p>{t(dict, "footer.phone")}</p>
                <p>{t(dict, "footer.email")}</p>
                <a
                  href="https://maps.google.com/?q=No.+41+Gana+Street,+Maitama,+Abuja,+Nigeria"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-block text-xs uppercase tracking-[0.2em] text-brand-gold/70 transition hover:text-brand-gold"
                >
                  {t(dict, "footer.mapLinkLabel")}
                </a>
              </div>
            </div>

            <div className="space-y-3 text-sm">
              <p className="text-xs uppercase tracking-[0.3em] text-brand-gold/70">{t(dict, "footer.hours")}</p>
              <div className="space-y-2 text-brand-ink/70">
                <p className="text-xs uppercase tracking-[0.2em] text-brand-ink/50">{t(dict, "footer.restaurant")}</p>
                <p>{t(dict, "footer.restaurantHours")}</p>
                <p>{t(dict, "footer.restaurantHoursWeekend")}</p>
                <p className="pt-2 text-xs uppercase tracking-[0.2em] text-brand-ink/50">{t(dict, "footer.market")}</p>
                <p>{t(dict, "footer.marketHours")}</p>
              </div>
            </div>

            <div className="space-y-3 text-sm">
              <p className="text-xs uppercase tracking-[0.3em] text-brand-gold/70">{t(dict, "footer.social")}</p>
              <div className="flex flex-col gap-2">
                <a
                  href="https://www.instagram.com/charme_restaurant/"
                  className="text-brand-ink/70 transition hover:text-brand-gold"
                  target="_blank"
                  rel="noreferrer"
                >
                  Instagram
                </a>
                <a
                  href="https://web.facebook.com/charmesupermarket"
                  className="text-brand-ink/70 transition hover:text-brand-gold"
                  target="_blank"
                  rel="noreferrer"
                >
                  Facebook
                </a>
              </div>
            </div>
          </div>

          <div className="mt-10 border-t border-brand-gold/10 pt-6 text-xs text-brand-ink/60">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p>{t(dict, "footer.copyright")}</p>
              <p>{t(dict, "footer.cuisineTag")}</p>
            </div>
          </div>
        </Container>
      </footer>
    </div>
  );
}
