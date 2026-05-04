"use client";

import Link from "next/link";
import { useCartStore } from "@/store/useCartStore";

type CartIconLinkProps = {
  locale: string;
  country: string;
};

export default function CartIconLink({ locale, country }: CartIconLinkProps) {
  const { itemCount } = useCartStore();

  return (
    <Link
      id="cart-icon"
      href={`/${locale}/${country}/cart`}
      aria-label="Cart"
      className="relative flex h-10 w-10 items-center justify-center rounded-full border border-brand-gold/30 bg-black/40 text-brand-gold transition"
    >
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M6 6h15l-1.5 9h-12z" />
        <path d="M6 6l-1-3H2" />
        <circle cx="9" cy="20" r="1" />
        <circle cx="18" cy="20" r="1" />
      </svg>
      {itemCount > 0 ? (
        <span
          key={itemCount}
          aria-live="polite"
          className="absolute -right-1 -top-1 rounded-full bg-brand-gold px-1.5 py-0.5 text-[10px] font-semibold text-black animate-count"
        >
          {itemCount}
        </span>
      ) : null}
    </Link>
  );
}
