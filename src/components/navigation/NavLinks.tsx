import Link from "next/link";

const links = [
  { label: "Menu", href: "menu" },
  { label: "Market", href: "market" },
  { label: "Offers", href: "offers" },
  { label: "Locations", href: "locations" },
  { label: "About", href: "about" }
];

export default function NavLinks({
  locale,
  country,
  onNavigate
}: {
  locale: string;
  country: string;
  onNavigate?: () => void;
}) {
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
      {links.map((link) => (
        <Link
          key={link.href}
          href={`/${locale}/${country}/${link.href}`}
          onClick={onNavigate}
          className="text-sm font-medium text-brand-ink/80 transition hover:text-brand-ink"
        >
          {link.label}
        </Link>
      ))}
    </div>
  );
}
