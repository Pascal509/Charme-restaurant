"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import Container from "@/components/layout/Container";
import ImageWrapper from "@/components/ui/ImageWrapper";
import { useCartStore } from "@/store/useCartStore";

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
  description: string;
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
};

const CART_ADD_ENDPOINT = "/api/cart/add";

export default function MarketPage({ categories }: MarketPageProps) {
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

  const filteredCategories = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();
    const minValue = minPrice ? Number(minPrice) : null;
    const maxValue = maxPrice ? Number(maxPrice) : null;

    const priceInRange = (amountMinor: number) => {
      const amount = amountMinor / 100;
      if (minValue !== null && Number.isFinite(minValue) && amount < minValue) return false;
      if (maxValue !== null && Number.isFinite(maxValue) && amount > maxValue) return false;
      return true;
    };

    const matchesFilters = (product: MarketProduct) => {
      const matchesSearch = search ? product.title.toLowerCase().includes(search) : true;
      const matchesAvailability = inStockOnly ? product.variant.stockOnHand > 0 : true;
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
  }, [categories, selectedCategoryId, searchTerm, minPrice, maxPrice, inStockOnly]);

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

  const cartQuery = useQuery<{ cart?: { items: Array<{ quantity: number }> } }>({
    queryKey: ["cart", guestId],
    enabled: Boolean(guestId),
    queryFn: async () => {
      const response = await fetch(`/api/cart?guestId=${guestId}`);
      if (!response.ok) return {};
      return response.json();
    },
    staleTime: 15 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false
  });

  useEffect(() => {
    const count = cartQuery.data?.cart?.items?.reduce((sum, item) => sum + item.quantity, 0) ?? 0;
    setItemCount(count);
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
        throw new Error(error.error || "Failed to add to cart");
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
          <p className="seal-badge">Market</p>
          <h1 className="mt-4 font-display text-3xl text-brand-ink sm:text-4xl lg:text-5xl">
            Asian Grocery Essentials
          </h1>
          <p className="mt-4 max-w-3xl text-sm text-brand-ink/70 sm:text-base">
            Pantry staples, premium sauces, and tea essentials curated for your home kitchen.
          </p>
          <div className="mt-6 flex items-center text-sm font-semibold text-brand-ink">
            Cart
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
                <h2 className="font-serif text-lg text-brand-ink">Find pantry essentials</h2>
              </div>
              <div className="flex items-center gap-3 text-xs text-brand-ink/60">
                <span>Filters update instantly</span>
              </div>
            </div>
            <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr_1fr_auto]">
              <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-brand-ink/60">
                Search products
                <input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search by name"
                  className="h-11 rounded-full border border-brand-gold/20 bg-black/20 px-4 text-sm font-medium text-brand-ink transition placeholder:text-brand-ink/40 focus:border-brand-gold focus:outline-none focus:ring-2 focus:ring-brand-gold/50"
                />
              </label>
              <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-brand-ink/60">
                Min price
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
                Max price
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
                In Stock
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
                    All
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
                  No products found. Try adjusting your filters.
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
                                categoryName={category.name}
                                onAdd={(quantity) =>
                                  addMutation.mutate({
                                    productVariantId: product.variant.id,
                                    quantity
                                  })
                                }
                                isAdding={addMutation.isPending}
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

function ProductCard({
  product,
  categoryName,
  onAdd,
  isAdding
}: {
  product: MarketProduct;
  categoryName: string;
  onAdd: (quantity: number) => void;
  isAdding: boolean;
}) {
  const [quantity, setQuantity] = useState(1);
  const priceLabel = formatCurrency(product.variant.amountMinor, product.variant.currency);
  const outOfStock = product.variant.stockOnHand <= 0;
  const lowStock = product.variant.stockOnHand > 0 && product.variant.stockOnHand <= 10;
  const imageMeta = getMarketImage(product.title);

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
          {product.title}
        </h3>
        <span className="text-sm font-semibold text-brand-gold">{priceLabel}</span>
      </div>
      {product.description ? (
        <p className="mt-2 line-clamp-2 text-xs text-brand-ink/60">{product.description}</p>
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
          {outOfStock ? "Out of Stock" : lowStock ? "Low Stock" : "In Stock"}
        </span>
        <div className="flex items-center gap-2 rounded-full border border-brand-gold/20 px-2 py-1">
          <button
            type="button"
            onClick={() => setQuantity((value) => Math.max(1, value - 1))}
            className="text-brand-ink/70 transition hover:text-brand-gold"
            aria-label="Decrease quantity"
          >
            -
          </button>
          <span className="min-w-[20px] text-center text-xs font-semibold text-brand-ink">
            {quantity}
          </span>
          <button
            type="button"
            onClick={() => setQuantity((value) => Math.min(20, value + 1))}
            className="text-brand-ink/70 transition hover:text-brand-gold"
            aria-label="Increase quantity"
          >
            +
          </button>
        </div>
      </div>
      <button
        onClick={() => onAdd(quantity)}
        disabled={outOfStock || isAdding}
        className="mt-4 rounded-full bg-brand-gold px-4 py-2 text-xs font-semibold text-black transition hover:bg-brand-gold/90 disabled:cursor-not-allowed disabled:bg-brand-ink/20"
      >
        {outOfStock ? "Out of Stock" : "Add to Cart"}
      </button>
    </div>
  );
}

function PaginationBar({
  currentPage,
  totalPages,
  onPageChange,
  className
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}) {
  const pageItems = buildPaginationItems(currentPage, totalPages);

  return (
    <div className={`flex flex-wrap items-center justify-between gap-4 ${className ?? ""}`}>
      <p className="text-xs uppercase tracking-[0.25em] text-brand-ink/50">
        Showing page {currentPage} of {totalPages}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="rounded-full border border-brand-gold/20 px-4 py-2 text-xs font-semibold text-brand-ink/70 transition hover:border-brand-gold/40 hover:text-brand-gold disabled:cursor-not-allowed disabled:opacity-40"
        >
          Prev
        </button>
        <button
          type="button"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="rounded-full border border-brand-gold/20 px-4 py-2 text-xs font-semibold text-brand-ink/70 transition hover:border-brand-gold/40 hover:text-brand-gold disabled:cursor-not-allowed disabled:opacity-40"
        >
          Next
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
  const name = productName.toLowerCase();
  const needsTopCrop = name.includes("soup") || name.includes("noodle") || name.includes("bowl");
  const position = needsTopCrop ? "object-top" : "object-center";

  if (name.includes("instant") || name.includes("ramen") || name.includes("noodle") || name.includes("udon") || name.includes("jjajang") || name.includes("tom yum")) {
    if (name.includes("cheese")) return { src: "/sup_images/cheese-ramen-soup.jpg", position };
    if (name.includes("beef bone")) return { src: "/sup_images/nongshim-beef-bone-ramen.jpg", position };
    if (name.includes("black pepper")) return { src: "/sup_images/koka-black-pepper-fried-noodles.jpg", position };
    if (name.includes("spicy beef")) return { src: "/sup_images/koka-spicy-beef-flavor-noodles.jpg", position };
    if (name.includes("chicken")) return { src: "/sup_images/koka-chicken-flavor-noodles.jpg", position };
    if (name.includes("jajang") || name.includes("jjajang")) return { src: "/sup_images/paldo-black-bean-sauce-noodles.jpg", position };
    if (name.includes("ramyun") || name.includes("ramen")) return { src: "/sup_images/shim-ramyun.jpg", position };
    if (name.includes("udon")) return { src: "/sup_images/nongshim-udon-ramen.jpg", position };
    if (name.includes("tom yum")) return { src: "/sup_images/tomyun-soup-instant-noodles.jpg", position };
    return { src: "/sup_images/instant-noodles.jpg", position };
  }
  if (name.includes("rice cake") || name.includes("tteokbokki") || name.includes("tteok")) {
    if (name.includes("cheese")) return { src: "/sup_images/bibigo-cheese-tteokbokki-rice-cakes.jpg", position };
    return { src: "/sup_images/bibigo-original-tteokbokki-rice-cakes.jpg", position };
  }
  if (name.includes("soy sauce") || name.includes("soy") || name.includes("seasoning") || name.includes("paste") || name.includes("sauce") || name.includes("marinade") || name.includes("dressing") || name.includes("curry") || name.includes("gochujang") || name.includes("ssamjang") || name.includes("teriyaki") || name.includes("sesame")) {
    if (name.includes("bulgogi")) return { src: "/sup_images/sempio-korean-bbq-bulgogi-sauce.jpg", position };
    if (name.includes("kewpie") || name.includes("mayonnaise")) return { src: "/sup_images/kewpie-mayonnaise.jpg", position };
    if (name.includes("sesame")) return { src: "/sup_images/kewpie-roasted-sesame-dressing.jpg", position };
    if (name.includes("teriyaki")) return { src: "/sup_images/teriyaki-sauce.jpg", position };
    if (name.includes("gochujang")) return { src: "/sup_images/sempio-guchujang-korean-chili-paste.jpg", position };
    if (name.includes("ssamjang")) return { src: "/sup_images/sempio-ssamjang-korean-soybean-dipping-paste.jpg", position };
    if (name.includes("curry")) return { src: "/sup_images/house-kokumaro-curry.jpg", position };
    if (name.includes("soybean paste") || name.includes("doenjang") || name.includes("tojang") || name.includes("deonchang")) return { src: "/sup_images/sempio-tojang-soybean-paste.jpg", position };
    return { src: "/sup_images/soy-sauce-for-dumplings.jpg", position };
  }
  if (name.includes("snack") || name.includes("chips") || name.includes("cracker") || name.includes("cookie") || name.includes("pocky") || name.includes("pretz") || name.includes("popcorn") || name.includes("wafers") || name.includes("biscuit") || name.includes("waffle")) {
    if (name.includes("seaweed")) return { src: "/sup_images/seasoned-seaweed.jpg", position };
    if (name.includes("chili") || name.includes("spicy")) return { src: "/sup_images/calbee-hot-&-spicy-potato-chips.jpg", position };
    if (name.includes("garlic")) return { src: "/sup_images/garlic-shrimp-chips.jpg", position };
    if (name.includes("butter")) return { src: "/sup_images/butter-garlic-shrimp-chips.jpg", position };
    if (name.includes("pocky")) return { src: "/sup_images/pocky-chocolate.jpg", position };
    if (name.includes("pretz")) return { src: "/sup_images/pretz-salt-butter-flavor.jpg", position };
    if (name.includes("popcorn")) return { src: "/sup_images/salt-popcorn.jpg", position };
    if (name.includes("wafers")) return { src: "/sup_images/beatrix-potter-wafers.jpg", position };
    if (name.includes("cookie")) return { src: "/sup_images/oreo-biscuits.jpg", position };
    return { src: "/sup_images/zzang-snack.jpg", position };
  }
  if (name.includes("drink") || name.includes("soda") || name.includes("water") || name.includes("milk") || name.includes("tea") || name.includes("juice") || name.includes("coffee") || name.includes("sparkling")) {
    if (name.includes("water")) return { src: "/sup_images/aqua-panna-natural-mineral-water.jpg", position: "object-center" };
    if (name.includes("milk")) return { src: "/sup_images/binggrae-banana-flavored-milk.jpg", position: position };
    if (name.includes("tea")) return { src: "/sup_images/calpis-soda-drink.jpg", position: "object-top" };
    if (name.includes("coffee")) return { src: "/sup_images/maxwell-house-maxwell-coffee.jpg", position };
    return { src: "/sup_images/ambasa-drink.jpg", position: "object-top" };
  }
  if (name.includes("detergent") || name.includes("soap") || name.includes("shampoo") || name.includes("cream") || name.includes("lotion") || name.includes("deodorant") || name.includes("sunscreen")) {
    if (name.includes("detergent")) return { src: "/sup_images/ariel-detergent.jpg", position };
    if (name.includes("shampoo")) return { src: "/sup_images/aquair-foaming-shampoo.jpg", position };
    if (name.includes("cream")) return { src: "/sup_images/dove-moisturizing-cream.jpg", position };
    if (name.includes("lotion") || name.includes("sunscreen")) return { src: "/sup_images/anessa-uv-screen.jpg", position };
    return { src: "/sup_images/irish-spring-soap.jpg", position };
  }
  if (name.includes("fruit") || name.includes("vegetable") || name.includes("veges")) {
    return { src: "/sup_images/fruits-and-veges.jpg", position };
  }

  return { src: "/sup_images/korean-staples.jpg", position };
}
