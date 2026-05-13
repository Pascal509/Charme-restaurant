"use client";

import { memo, useCallback, useDeferredValue, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import Container from "@/components/layout/Container";
import ImageWrapper from "@/components/ui/ImageWrapper";
import { useCartStore } from "@/store/useCartStore";
import LocaleSwitcher from "@/components/navigation/LocaleSwitcher";
import { getDictionary, t, normalizeLocale } from "@/lib/i18n";
import { resolveProductImage } from "@/lib/image-resolver";

type MarketVariant = {
  id: string;
  title: string;
  amountMinor: number;
  currency: string;
  stockOnHand: number;
};

type MarketProduct = {
  id: string;
  title: string;
  titleZh?: string;
  description: string;
  descriptionZh?: string;
  imageUrl?: string | null;
  variant: MarketVariant;
};

type MarketCategory = {
  id: string;
  name: string;
  slug: string;
  products: MarketProduct[];
};

type MarketPageProps = {
  categories: MarketCategory[];
  locale?: string;
};

const CART_ADD_ENDPOINT = "/api/cart/add";

export default function MarketPage({ categories, locale }: MarketPageProps) {
  const dict = getDictionary(locale);
  const ITEMS_PER_PAGE = 8;
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | "all">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [inStockOnly, setInStockOnly] = useState(false);
  const [guestId, setGuestId] = useState<string | null>(null);
  const [categoryPages, setCategoryPages] = useState<Record<string, number>>({});
  const { itemCount, setItemCount, incrementBy } = useCartStore();
  const deferredSearchTerm = useDeferredValue(searchTerm);
  const deferredMinPrice = useDeferredValue(minPrice);
  const deferredMaxPrice = useDeferredValue(maxPrice);
  const deferredInStockOnly = useDeferredValue(inStockOnly);

  const filteredCategories = useMemo(() => {
    const search = deferredSearchTerm.trim().toLowerCase();
    const minValue = deferredMinPrice ? Number(deferredMinPrice) : null;
    const maxValue = deferredMaxPrice ? Number(deferredMaxPrice) : null;

    const priceInRange = (amountMinor: number) => {
      const amount = amountMinor / 100;
      if (minValue !== null && Number.isFinite(minValue) && amount < minValue) return false;
      if (maxValue !== null && Number.isFinite(maxValue) && amount > maxValue) return false;
      return true;
    };

    const matchesFilters = (product: MarketProduct) => {
      const matchesSearch = search ? product.title.toLowerCase().includes(search) : true;
      const matchesAvailability = deferredInStockOnly ? product.variant.stockOnHand > 0 : true;
      const matchesPrice = priceInRange(product.variant.amountMinor);
      return matchesSearch && matchesAvailability && matchesPrice;
    };

    const scopedCategories =
      selectedCategoryId === "all"
        ? categories
        : categories.filter((category) => category.id === selectedCategoryId);

    return scopedCategories
      .map((category) => ({
        ...category,
        products: category.products.filter(matchesFilters)
      }))
      .filter((category) => category.products.length > 0);
  }, [categories, selectedCategoryId, deferredSearchTerm, deferredMinPrice, deferredMaxPrice, deferredInStockOnly]);

  useEffect(() => {
    setCategoryPages({});
  }, [selectedCategoryId, searchTerm, minPrice, maxPrice, inStockOnly]);

  useEffect(() => {
    if (!activeCategory && filteredCategories.length > 0) {
      setActiveCategory(filteredCategories[0].id);
    }
  }, [activeCategory, filteredCategories]);

  useEffect(() => {
    const id = resolveGuestId();
    if (id) setGuestId(id);
  }, []);

  const cartQuery = useQuery<{ cart?: { items: Array<{ quantity: number }> } }, Error, number>({
    queryKey: ["cart", guestId],
    enabled: Boolean(guestId),
    queryFn: async () => {
      const response = await fetch(`/api/cart?guestId=${guestId}`);
      if (!response.ok) return {};
      return response.json();
    },
    select: (data) => data.cart?.items?.reduce((sum, item) => sum + item.quantity, 0) ?? 0,
    staleTime: 15 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false
  });

  useEffect(() => {
    setItemCount(cartQuery.data ?? 0);
  }, [cartQuery.data, setItemCount]);

  useEffect(() => {
    if (filteredCategories.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]?.target?.id) {
          setActiveCategory(visible[0].target.id);
        }
      },
      { rootMargin: "-30% 0px -60% 0px", threshold: [0.1, 0.25, 0.5] }
    );

    filteredCategories.forEach((category) => {
      const target = document.getElementById(category.id);
      if (target) observer.observe(target);
    });

    return () => observer.disconnect();
  }, [filteredCategories]);

  const addMutation = useMutation({
    mutationFn: async (payload: { productVariantId: string; quantity: number }) => {
      if (!guestId) throw new Error("Missing guest id");

      const response = await fetch(CART_ADD_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guestId,
          productVariantId: payload.productVariantId,
          quantity: payload.quantity,
          selectedOptions: []
        })
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || t(dict, "messages.failedAddCart"));
      }

      return response.json();
    },
    onMutate: (payload) => {
      incrementBy(payload.quantity);
      return { quantity: payload.quantity };
    },
    onError: (_error, _payload, context) => {
      if (context?.quantity) {
        incrementBy(-context.quantity);
      }
    }
  });

  const handleAddToCart = useCallback(
    (quantity: number, variantId: string) => {
      addMutation.mutate({ productVariantId: variantId, quantity });
    },
    [addMutation]
  );

  const cartBadge = itemCount > 0 ? (
    <span
      key={itemCount}
      className="ml-2 rounded-full bg-brand-gold/90 px-2 py-0.5 text-xs font-semibold text-black animate-count"
    >
      {itemCount}
    </span>
  ) : null;

  return (
    <main className="scroll-smooth bg-brand-obsidian text-brand-ink lux-gradient page-transition">
      <Container className="py-16 lg:py-20">
        <section className="rounded-3xl border border-brand-gold/10 bg-black/40 px-6 py-10 shadow-crisp sm:px-10 sm:py-12">
          <div className="flex items-center justify-between">
            <p className="seal-badge">{t(dict, "market.title")}</p>
            <LocaleSwitcher currentLocale={locale ?? "en"} variant="inline" />
          </div>

          <h1 className="mt-4 font-display text-3xl text-brand-ink sm:text-4xl lg:text-5xl">
            Asian Grocery Essentials
          </h1>
          <p className="mt-4 max-w-3xl text-sm text-brand-ink/70 sm:text-base">
            Pantry staples, premium sauces, and tea essentials curated for your home kitchen.
          </p>
          <div className="mt-6 flex items-center text-sm font-semibold text-brand-ink">
            {t(dict, "nav.cart")}
            {cartBadge}
          </div>
        </section>
      </Container>

      <section className="border-t border-brand-gold/10 bg-brand-obsidian/80">
        <Container className="py-10 lg:py-12">
          <div className="mb-10 grid gap-4 rounded-2xl border border-brand-gold/10 bg-white/5 p-4 transition sm:p-6">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-gold/70">
                  Search
                </p>
                <h2 className="font-serif text-lg text-brand-ink">{t(dict, "market.searchTitle")}</h2>
              </div>
              <div className="flex items-center gap-3 text-xs text-brand-ink/60">
                <span>{t(dict, "market.filtersUpdateInstantly")}</span>
              </div>
            </div>
            <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr_1fr_auto]">
                <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-brand-ink/60">
                {t(dict, "market.searchPlaceholder")}
                <input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder={t(dict, "market.searchPlaceholder")}
                  className="h-11 rounded-full border border-brand-gold/20 bg-black/20 px-4 text-sm font-medium text-brand-ink transition placeholder:text-brand-ink/40 focus:border-brand-gold focus:outline-none focus:ring-2 focus:ring-brand-gold/50"
                />
              </label>
              <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-brand-ink/60">
                {t(dict, "market.minPrice")}
                <input
                  type="number"
                  min="0"
                  value={minPrice}
                  onChange={(event) => setMinPrice(event.target.value)}
                  placeholder="0"
                  className="h-11 rounded-full border border-brand-gold/20 bg-black/20 px-4 text-sm font-medium text-brand-ink transition placeholder:text-brand-ink/40 focus:border-brand-gold focus:outline-none focus:ring-2 focus:ring-brand-gold/50"
                />
              </label>
              <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-brand-ink/60">
                {t(dict, "market.maxPrice")}
                <input
                  type="number"
                  min="0"
                  value={maxPrice}
                  onChange={(event) => setMaxPrice(event.target.value)}
                  placeholder="200"
                  className="h-11 rounded-full border border-brand-gold/20 bg-black/20 px-4 text-sm font-medium text-brand-ink transition placeholder:text-brand-ink/40 focus:border-brand-gold focus:outline-none focus:ring-2 focus:ring-brand-gold/50"
                />
              </label>
              <label className="flex items-center gap-3 rounded-full border border-brand-gold/20 bg-black/20 px-4 text-xs font-semibold uppercase tracking-[0.2em] text-brand-ink/70 transition focus-within:border-brand-gold focus-within:ring-2 focus-within:ring-brand-gold/50">
                <input
                  type="checkbox"
                  checked={inStockOnly}
                  onChange={(event) => setInStockOnly(event.target.checked)}
                  className="h-4 w-4 rounded border-brand-gold/40 bg-transparent text-brand-gold focus:ring-0"
                />
                {t(dict, "market.inStockOnly")}
              </label>
            </div>
          </div>

          <div className="grid gap-8 lg:grid-cols-[200px_1fr]">
            <aside className="hidden lg:block">
              <div className="sticky top-24 space-y-4">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-gold/70">
                  Categories
                </p>
                <nav className="flex flex-col gap-2">
                  <button
                    onClick={() => setSelectedCategoryId("all")}
                    className={`rounded-full px-4 py-2 text-left text-sm transition ${
                      selectedCategoryId === "all"
                        ? "bg-brand-gold text-black"
                        : "text-brand-ink/70 hover:bg-brand-gold/10"
                    }`}
                  >
                    All
                  </button>
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => {
                        setSelectedCategoryId(category.id);
                        scrollToCategory(category.id);
                      }}
                      className={`rounded-full px-4 py-2 text-left text-sm transition ${
                        activeCategory === category.id && selectedCategoryId !== "all"
                          ? "bg-brand-gold text-black"
                          : "text-brand-ink/70 hover:bg-brand-gold/10"
                      }`}
                    >
                      {category.name}
                    </button>
                  ))}
                </nav>
              </div>
            </aside>

            <div className="space-y-16">
              <div className="sticky top-16 z-30 -mx-6 border-y border-brand-gold/10 bg-brand-obsidian/85 px-6 py-4 backdrop-blur lg:hidden">
                <div className="flex gap-3 overflow-x-auto pb-1">
                  <button
                    onClick={() => setSelectedCategoryId("all")}
                    className={`whitespace-nowrap rounded-full border px-4 py-2 text-xs font-semibold transition ${
                      selectedCategoryId === "all"
                        ? "border-brand-gold bg-brand-gold text-black"
                        : "border-brand-gold/30 text-brand-ink/70"
                    }`}
                  >
                    {t(dict, "market.all")}
                  </button>
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => {
                        setSelectedCategoryId(category.id);
                        scrollToCategory(category.id);
                      }}
                      className={`whitespace-nowrap rounded-full border px-4 py-2 text-xs font-semibold transition ${
                        activeCategory === category.id && selectedCategoryId !== "all"
                          ? "border-brand-gold bg-brand-gold text-black"
                          : "border-brand-gold/30 text-brand-ink/70"
                      }`}
                    >
                      {category.name}
                    </button>
                  ))}
                </div>
              </div>

              {filteredCategories.length === 0 ? (
                <div className="rounded-2xl border border-brand-gold/10 bg-white/5 px-6 py-12 text-center text-sm text-brand-ink/70 transition">
                  {t(dict, "market.noResults")} {t(dict, "market.adjustFilters")}
                </div>
              ) : (
                filteredCategories.map((category) => (
                  <section key={category.id} id={category.id} className="scroll-mt-32">
                    <div className="border-t border-brand-gold/10 pt-8">
                      <h2 className="font-serif text-2xl font-semibold tracking-wide text-brand-ink sm:text-3xl">
                        {category.name}
                      </h2>
                    </div>
                    {(() => {
                      const totalPages = Math.max(1, Math.ceil(category.products.length / ITEMS_PER_PAGE));
                      const currentPage = Math.min(categoryPages[category.id] ?? 1, totalPages);
                      const start = (currentPage - 1) * ITEMS_PER_PAGE;
                      const visibleProducts = category.products.slice(start, start + ITEMS_PER_PAGE);

                      return (
                        <>
                          <div className="mt-6 grid grid-cols-2 gap-6 md:grid-cols-3 xl:grid-cols-4">
                            {visibleProducts.map((product) => (
                              <ProductCard
                                key={product.id}
                                product={product}
                                onAdd={(quantity) => handleAddToCart(quantity, product.variant.id)}
                                isAdding={addMutation.isPending}
                                locale={locale}
                                dict={dict}
                              />
                            ))}
                          </div>
                          {totalPages > 1 ? (
                            <PaginationBar
                              className="mt-8"
                              currentPage={currentPage}
                              totalPages={totalPages}
                              onPageChange={(nextPage) =>
                                setCategoryPages((current) => ({
                                  ...current,
                                  [category.id]: nextPage
                                }))
                              }
                              dict={dict}
                            />
                          ) : null}
                        </>
                      );
                    })()}
                  </section>
                ))
              )}
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}

const ProductCard = memo(function ProductCard({
  product,
  onAdd,
  isAdding,
  locale,
  dict
}: {
  product: MarketProduct;
  onAdd: (quantity: number) => void;
  isAdding: boolean;
  locale?: string;
  dict: ReturnType<typeof getDictionary>;
}) {
  const [quantity, setQuantity] = useState(1);
  const localeNormalized = normalizeLocale(locale);
  const priceLabel = formatCurrency(product.variant.amountMinor, product.variant.currency);
  const outOfStock = product.variant.stockOnHand <= 0;
  const lowStock = product.variant.stockOnHand > 0 && product.variant.stockOnHand <= 10;
  const imageMeta = getMarketImage(product.title);

  const handleDecreaseQuantity = useCallback(() => {
    setQuantity((value) => Math.max(1, value - 1));
  }, []);

  const handleIncreaseQuantity = useCallback(() => {
    setQuantity((value) => Math.min(20, value + 1));
  }, []);

  const handleAdd = useCallback(() => {
    onAdd(quantity);
  }, [onAdd, quantity]);

  return (
    <div className="group flex h-full flex-col rounded-2xl border border-brand-gold/10 bg-white/5 p-5 transition duration-300 hover:-translate-y-1 hover:shadow-crisp">
      <ImageWrapper
        src={imageMeta.src}
        alt={product.title}
        aspect="market"
        sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
        className="mb-4"
        imageClassName="transition duration-300 group-hover:scale-[1.03]"
        objectPositionClassName={imageMeta.position}
        overlayClassName="opacity-60"
      />
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-serif text-base font-medium tracking-wide text-brand-ink sm:text-lg">
          {localeNormalized === "zh-CN" ? (product.titleZh ?? product.title) : product.title}
        </h3>
        <span className="text-sm font-semibold text-brand-gold">{priceLabel}</span>
      </div>
      {product.description || product.descriptionZh ? (
        <p className="mt-2 line-clamp-2 text-xs text-brand-ink/60">{localeNormalized === "zh-CN" ? (product.descriptionZh ?? product.description) : product.description}</p>
      ) : null}
      <div className="mt-3 flex items-center justify-between text-xs">
        <span
          className={`rounded-full border px-2 py-1 ${
            outOfStock
              ? "border-brand-ink/20 text-brand-ink/40"
              : lowStock
                ? "border-brand-gold/40 text-brand-gold"
                : "border-brand-jade/40 text-brand-jade"
          }`}
        >
          {outOfStock
              ? t(dict, "market.outOfStock")
              : lowStock
                ? t(dict, "market.lowStock")
                : t(dict, "market.inStock")}
        </span>
        <div className="flex items-center gap-2 rounded-full border border-brand-gold/20 px-2 py-1">
          <button
            type="button"
            onClick={handleDecreaseQuantity}
            className="text-brand-ink/70 transition hover:text-brand-gold"
            aria-label={t(dict, "market.decreaseQuantity")}
          >
            -
          </button>
          <span className="min-w-[20px] text-center text-xs font-semibold text-brand-ink">
            {quantity}
          </span>
          <button
            type="button"
            onClick={handleIncreaseQuantity}
            className="text-brand-ink/70 transition hover:text-brand-gold"
            aria-label={t(dict, "market.increaseQuantity")}
          >
            +
          </button>
        </div>
      </div>
      <button
        onClick={handleAdd}
        disabled={outOfStock || isAdding}
        className="mt-4 rounded-full bg-brand-gold px-4 py-2 text-xs font-semibold text-black transition hover:bg-brand-gold/90 disabled:cursor-not-allowed disabled:bg-brand-ink/20"
      >
        {outOfStock ? t(dict, "market.outOfStock") : t(dict, "market.addToCart")}
      </button>
    </div>
  );
});

function PaginationBar({
  currentPage,
  totalPages,
  onPageChange,
  className,
  dict
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
  dict: ReturnType<typeof getDictionary>;
}) {
  const pageItems = buildPaginationItems(currentPage, totalPages);

  return (
    <div className={`flex flex-wrap items-center justify-between gap-4 ${className ?? ""}`}>
      <p className="text-xs uppercase tracking-[0.25em] text-brand-ink/50">
        {t(dict, "market.showingPage").replace("{current}", String(currentPage)).replace("{total}", String(totalPages))}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="rounded-full border border-brand-gold/20 px-4 py-2 text-xs font-semibold text-brand-ink/70 transition hover:border-brand-gold/40 hover:text-brand-gold disabled:cursor-not-allowed disabled:opacity-40"
        >
          {t(dict, "common.prev")}
        </button>
        <button
          type="button"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="rounded-full border border-brand-gold/20 px-4 py-2 text-xs font-semibold text-brand-ink/70 transition hover:border-brand-gold/40 hover:text-brand-gold disabled:cursor-not-allowed disabled:opacity-40"
        >
          {t(dict, "common.next")}
        </button>
        {pageItems.map((pageItem, index) =>
          pageItem === "ellipsis" ? (
            <span key={`ellipsis-${index}`} className="px-2 text-xs text-brand-ink/40">
              ...
            </span>
          ) : (
            <button
              key={pageItem}
              type="button"
              onClick={() => onPageChange(pageItem)}
              className={`min-w-9 rounded-full border px-3 py-2 text-xs font-semibold transition ${
                pageItem === currentPage
                  ? "border-brand-gold bg-brand-gold text-black"
                  : "border-brand-gold/20 text-brand-ink/70 hover:border-brand-gold/40 hover:text-brand-gold"
              }`}
            >
              {pageItem}
            </button>
          )
        )}
      </div>
    </div>
  );
}

function buildPaginationItems(currentPage: number, totalPages: number) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const items: Array<number | "ellipsis"> = [1];
  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);

  if (start > 2) items.push("ellipsis");

  for (let page = start; page <= end; page += 1) {
    items.push(page);
  }

  if (end < totalPages - 1) items.push("ellipsis");

  items.push(totalPages);
  return items;
}

function formatCurrency(amountMinor: number, currency: string) {
  const formatter = new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency
  });
  return formatter.format(amountMinor / 100);
}

function resolveGuestId() {
  if (typeof window === "undefined") return null;

  const stored = window.localStorage.getItem("guestId");
  if (stored) return stored;

  const nextId = typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `guest_${Date.now()}_${Math.random().toString(16).slice(2)}`;

  window.localStorage.setItem("guestId", nextId);
  return nextId;
}

function scrollToCategory(id: string) {
  const target = document.getElementById(id);
  if (!target) return;
  target.scrollIntoView({ behavior: "smooth", block: "start" });
}

function getMarketImage(productName: string) {
  return resolveProductImage(productName);
}
