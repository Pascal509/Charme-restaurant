import Link from "next/link";
import { getDictionary, t } from "@/lib/i18n";

const links = [
  { key: "menu", href: "menu" },
  { key: "market", href: "market" },
  { key: "offers", href: "offers" },
  { key: "locations", href: "locations" },
  { key: "about", href: "about" }
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
  const dict = getDictionary(locale);

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
      {links.map((link) => (
        <Link
          key={link.href}
          href={`/${locale}/${country}/${link.href}`}
          onClick={onNavigate}
          className="text-sm font-medium text-brand-ink/80 transition hover:text-brand-ink"
        >
          {t(dict, `nav.${link.key}`)}
        </Link>
      ))}
    </div>
  );
}
