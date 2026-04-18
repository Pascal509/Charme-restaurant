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
    <div className="min-h-screen bg-brand-rice">
      <header className="border-b border-brand-ink/10 bg-brand-rice/95 backdrop-blur">
        <Container className="flex items-center justify-between py-4">
          <DesktopNav locale={locale} country={country} />
          <MobileNav locale={locale} country={country} />
        </Container>
      </header>
      {children}
      <footer className="border-t border-brand-ink/10 py-10">
        <Container>
          <div className="flex flex-col gap-3 text-sm text-brand-ink/70">
            <p>Charme Supermarket and Restaurant</p>
            <p>Premium Chinese and Taiwanese dining and groceries in Nigeria.</p>
          </div>
        </Container>
      </footer>
    </div>
  );
}
