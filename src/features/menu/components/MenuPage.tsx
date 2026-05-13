"use client";

import { memo, useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useMutation, useQuery } from "@tanstack/react-query";
import Container from "@/components/layout/Container";
import ImageWrapper from "@/components/ui/ImageWrapper";
import { useCartStore } from "@/store/useCartStore";
import type { MenuItem, SelectedMap } from "@/features/menu/types";
import LocaleSwitcher from "@/components/navigation/LocaleSwitcher";
import { getDictionary, t, normalizeLocale } from "@/lib/i18n";
import { resolveMenuImage } from "@/lib/image-resolver";

const ModifierDrawer = dynamic(() => import("@/features/menu/components/ModifierDrawer"), {
  ssr: false
});
const ItemDetailModal = dynamic(() => import("@/features/menu/components/ItemDetailModal"), {
  ssr: false
});

const CART_ADD_ENDPOINT = "/api/cart/add";

type MenuCategory = {
  id: string;
  name: string;
  description?: string | null;
  displayOrder: number;
  isActive: boolean;
  items: MenuItem[];
};

type MenuPageProps = {
  categories: MenuCategory[];
  locale?: string;
};

type MenuImage = {
  src: string;
  position: "object-top" | "object-center" | "object-bottom";
};

export default function MenuPage({ categories: initialCategories, locale }: MenuPageProps) {
  const dict = getDictionary(locale);
  const ITEMS_PER_PAGE = 6;
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<SelectedMap>({});
  const [detailItem, setDetailItem] = useState<MenuItem | null>(null);
  const [detailQty, setDetailQty] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | "all">("all");
  const [priceFilter, setPriceFilter] = useState<string>("all");
  const [focusedItem, setFocusedItem] = useState<MenuItem | null>(null);
  const [guestId, setGuestId] = useState<string | null>(null);
  const [categoryPages, setCategoryPages] = useState<Record<string, number>>({});
  const { itemCount, setItemCount, incrementBy } = useCartStore();
  const deferredSearchTerm = useDeferredValue(searchTerm);


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

  const addMutation = useMutation({
    mutationFn: async (payload: { menuItemId: string; quantity: number; selectedOptions: string[] }) => {
      if (!guestId) throw new Error("Missing guest id");

      const response = await fetch(CART_ADD_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guestId,
          menuItemId: payload.menuItemId,
          quantity: payload.quantity,
          selectedOptions: payload.selectedOptions
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

  const categories = useMemo(() => {
    const filtered = initialCategories.filter((category) => category.isActive);
    return filtered.sort((a, b) => a.displayOrder - b.displayOrder);
  }, [initialCategories]);

  useEffect(() => {
    if (!activeCategory && categories.length > 0) {
      setActiveCategory(categories[0].id);
    }
  }, [activeCategory, categories]);

  const filteredCategories = useMemo(() => {
    const term = deferredSearchTerm.trim().toLowerCase();
    const withinPrice = (item: MenuItem) => {
      if (priceFilter === "low") return item.priceMinor < 5000;
      if (priceFilter === "mid") return item.priceMinor >= 5000 && item.priceMinor < 15000;
      if (priceFilter === "high") return item.priceMinor >= 15000;
      return true;
    };

    return categories
      .filter((category) => selectedCategoryId === "all" || category.id === selectedCategoryId)
      .map((category) => ({
        ...category,
        items: category.items.filter((item) => {
          const match =
            item.name.toLowerCase().includes(term) ||
            (item.description ?? "").toLowerCase().includes(term);
          return match && withinPrice(item);
        })
      }))
      .filter((category) => category.items.length > 0);
  }, [categories, deferredSearchTerm, priceFilter, selectedCategoryId]);

  useEffect(() => {
    setCategoryPages({});
  }, [priceFilter, searchTerm, selectedCategoryId]);

  const featuredItems = useMemo(() => {
    const items = filteredCategories.flatMap((category) => category.items);
    return items.slice(0, 4);
  }, [filteredCategories]);

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

  const handleAddToCart = useCallback(
    (item: MenuItem, sourceEl?: HTMLDivElement | null, imageUrl?: string) => {
      if (item.modifierGroups && item.modifierGroups.length > 0) {
        setSelectedItem(item);
        setSelectedOptions({});
        return;
      }

      if (imageUrl && sourceEl) {
        animateFlyToCart(imageUrl, sourceEl);
      }
      pulseCartIcon();
      addMutation.mutate({ menuItemId: item.id, quantity: 1, selectedOptions: [] });
    },
    [addMutation]
  );

  const handleConfirmModifiers = useCallback(() => {
    if (!selectedItem) return;

    const flattened = Object.values(selectedOptions).flat();
    const invalid = selectedItem.modifierGroups?.some((group) => {
      const selected = selectedOptions[group.id]?.length ?? 0;
      const minSelect = group.required ? Math.max(1, group.minSelect) : group.minSelect;
      return selected < minSelect || selected > group.maxSelect;
    });

    if (invalid) {
      return;
    }

    addMutation.mutate({
      menuItemId: selectedItem.id,
      quantity: 1,
      selectedOptions: flattened
    });

    pulseCartIcon();

    setSelectedItem(null);
    setSelectedOptions({});
  }, [addMutation, selectedItem, selectedOptions]);

  const openDetail = useCallback((item: MenuItem) => {
    setDetailItem(item);
    setDetailQty(1);
  }, []);

  const handleConfirmDetail = useCallback(() => {
    if (!detailItem) return;
    if (detailItem.modifierGroups && detailItem.modifierGroups.length > 0) {
      setSelectedItem(detailItem);
      setSelectedOptions({});
      setDetailItem(null);
      return;
    }

    addMutation.mutate({
      menuItemId: detailItem.id,
      quantity: detailQty,
      selectedOptions: []
    });
    pulseCartIcon();
    setDetailItem(null);
  }, [addMutation, detailItem, detailQty]);

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
            <p className="seal-badge">{t(dict, "menu.title")}</p>
            <LocaleSwitcher currentLocale={locale ?? "en"} variant="inline" />
          </div>

          <h1 className="mt-4 font-display text-3xl text-brand-ink sm:text-4xl lg:text-5xl">
            {t(dict, "menu.heroTitle")}
          </h1>
          <p className="mt-4 max-w-3xl text-sm text-brand-ink/70 sm:text-base">
            {t(dict, "menu.heroSubtitle")}
          </p>
          <div className="mt-6 flex items-center text-sm font-semibold text-brand-ink">
            {t(dict, "nav.cart")}
            {cartBadge}
          </div>
        </section>
      </Container>

      <section className="border-t border-brand-gold/10 bg-brand-obsidian/80">
        <Container className="py-10 lg:py-12">
          {categories.length === 0 ? (
            <div className="rounded-2xl border border-brand-gold/10 bg-white/5 p-6 text-sm text-brand-ink/70 shadow-soft">
              {t(dict, "menu.emptyState")}
            </div>
          ) : (
            <div className="grid gap-8 lg:grid-cols-[220px_1fr]">
              <aside className="hidden lg:block">
                <div className="sticky top-24 space-y-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-gold/70">
                    {t(dict, "menu.categories")}
                  </p>
                  <nav className="flex flex-col gap-2">
                    {categories.map((category) => (
                      <button
                        key={category.id}
                        onClick={() => scrollToCategory(category.id)}
                        className={`rounded-full px-4 py-2 text-left text-sm transition ${
                          activeCategory === category.id
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

              <div className="space-y-20">
                <div className="space-y-4">
                  <div className="grid gap-4 rounded-2xl bg-white/5 p-6 sm:grid-cols-[1fr_200px_200px]">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-gold/70">
                        {t(dict, "menu.searchPlaceholder")}
                      </label>
                      <input
                        value={searchTerm}
                        onChange={(event) => setSearchTerm(event.target.value)}
                        placeholder={t(dict, "menu.searchPlaceholder")}
                        className="w-full rounded-xl border border-brand-gold/5 bg-black/30 px-3 py-2 text-sm text-brand-ink placeholder:text-brand-ink/40"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-gold/70">
                        {t(dict, "menu.categories")}
                      </label>
                      <select
                        value={selectedCategoryId}
                        onChange={(event) => setSelectedCategoryId(event.target.value as string)}
                        className="w-full rounded-xl border border-brand-gold/5 bg-black/30 px-3 py-2 text-sm text-brand-ink"
                      >
                        <option value="all">{t(dict, "menu.allOption")}</option>
                        {categories.map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-gold/70">
                        {t(dict, "menu.price")}
                      </label>
                      <select
                        value={priceFilter}
                        onChange={(event) => setPriceFilter(event.target.value)}
                        className="w-full rounded-xl border border-brand-gold/5 bg-black/30 px-3 py-2 text-sm text-brand-ink"
                      >
                        <option value="all">{t(dict, "menu.priceAll")}</option>
                        <option value="low">{t(dict, "menu.priceLow")}</option>
                        <option value="mid">{t(dict, "menu.priceMid")}</option>
                        <option value="high">{t(dict, "menu.priceHigh")}</option>
                      </select>
                    </div>
                  </div>

                  <div className="sticky top-16 z-30 -mx-6 border-y border-brand-gold/10 bg-brand-obsidian/85 px-6 py-4 backdrop-blur lg:hidden">
                    <MobileCategoryTabs
                      categories={categories}
                      activeCategory={activeCategory}
                      onChange={(id) => {
                        setActiveCategory(id);
                        scrollToCategory(id);
                      }}
                    />
                  </div>
                </div>

                {filteredCategories.length === 0 ? (
                  <div className="rounded-2xl border border-brand-gold/10 bg-white/5 p-6 text-sm text-brand-ink/70 shadow-soft">
                    {t(dict, "menu.noResults")}
                  </div>
                ) : null}

                {featuredItems.length > 0 ? (
                  <section className="scroll-mt-32">
                    <div className="border-t border-brand-gold/10 pt-10">
                      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-gold/70">
                        {t(dict, "menu.chefsSpecial")}
                      </p>
                      <h2 className="mt-3 font-serif text-3xl font-semibold tracking-wide text-brand-ink sm:text-4xl">
                        {t(dict, "menu.recommended")}
                      </h2>
                      <p className="mt-2 text-sm text-brand-ink/60">
                        {t(dict, "menu.featuredSubtitle")}
                      </p>
                    </div>
                    <div className="mt-10 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                      {featuredItems.map((item) => (
                        <MenuItemCard
                          key={`featured-${item.id}`}
                          item={item}
                          onAdd={handleAddToCart}
                            onOpen={openDetail}
                          onFocus={setFocusedItem}
                          locale={locale}
                          dict={dict}
                        />
                      ))}
                    </div>
                  </section>
                ) : null}

                {filteredCategories.map((category) => (
                  <section key={category.id} id={category.id} className="scroll-mt-32">
                    <div className="border-t border-brand-gold/10 pt-10">
                      <h2 className="font-serif text-3xl font-semibold tracking-wide text-brand-ink sm:text-4xl">
                        {category.name}
                      </h2>
                      {category.description ? (
                        <p className="mt-2 text-sm text-brand-ink/60 sm:text-base">
                          {category.description}
                        </p>
                      ) : null}
                    </div>
                    {(() => {
                      const totalPages = Math.max(1, Math.ceil(category.items.length / ITEMS_PER_PAGE));
                      const currentPage = Math.min(categoryPages[category.id] ?? 1, totalPages);
                      const start = (currentPage - 1) * ITEMS_PER_PAGE;
                      const visibleItems = category.items.slice(start, start + ITEMS_PER_PAGE);

                      return (
                        <>
                          <div className="mt-10 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                            {visibleItems.map((item) => (
                              <MenuItemCard
                                key={item.id}
                                item={item}
                                onAdd={handleAddToCart}
                                onOpen={openDetail}
                                onFocus={setFocusedItem}
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
                ))}
              </div>
            </div>
          )}
        </Container>
      </section>

      {selectedItem ? (
        <ModifierDrawer
          item={selectedItem}
          selected={selectedOptions}
          onSelect={setSelectedOptions}
          onClose={() => setSelectedItem(null)}
          onConfirm={handleConfirmModifiers}
          locale={locale}
        />
      ) : null}

      {detailItem ? (
        <ItemDetailModal
          item={detailItem}
          quantity={detailQty}
          onQuantityChange={setDetailQty}
          onClose={() => setDetailItem(null)}
          onConfirm={handleConfirmDetail}
          locale={locale}
        />
      ) : null}

      <MobileStickyCTA item={focusedItem} onAdd={handleAddToCart} onOpen={openDetail} dict={dict} />
    </main>
  );
}

const MenuItemCard = memo(function MenuItemCard({
  item,
  onAdd,
  onOpen,
  onFocus,
  locale,
  dict
}: {
  item: MenuItem;
  onAdd: (item: MenuItem, sourceEl?: HTMLDivElement | null, imageUrl?: string) => void;
  onOpen: (item: MenuItem) => void;
  onFocus: (item: MenuItem) => void;
  locale?: string;
  dict: ReturnType<typeof getDictionary>;
}) {
  const localeNormalized = normalizeLocale(locale);
  const imageRef = useRef<HTMLDivElement | null>(null);
  const blurData =
    "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNCIgaGVpZ2h0PSI0IiB2aWV3Qm94PSIwIDAgNCA0IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSI0IiBoZWlnaHQ9IjQiIGZpbGw9IiMxMTExMTEiLz48L3N2Zz4=";
  const image = getMenuImage(item.name);
  const isSpecial = isChefsSpecial(item);
  const spiceLevel = getSpiceLevel(item);

  return (
    <article
      className="group flex h-full flex-col overflow-hidden rounded-3xl border border-brand-gold/10 bg-white/5 shadow-soft transition duration-300 hover:-translate-y-1 hover:shadow-crisp"
      onMouseEnter={() => onFocus(item)}
      onTouchStart={() => onFocus(item)}
      onFocus={() => onFocus(item)}
      tabIndex={0}
    >
      <ImageWrapper
        ref={imageRef}
        src={image.src}
        alt={item.name}
        aspect="menu"
        sizes="(max-width: 768px) 100vw, 33vw"
        blurDataURL={blurData}
        className="w-full"
        imageClassName="image-focus transition duration-500 ease-out group-hover:scale-[1.04]"
        objectPositionClassName={image.position}
        overlayClassName="opacity-70"
      />
      <div className="flex flex-1 flex-col gap-4 p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-serif text-xl font-semibold tracking-wide text-brand-ink sm:text-2xl">
                {localeNormalized === "zh-CN" ? (item.nameZh ?? item.name) : item.name}
              </h3>
              {isSpecial ? (
                <span className="rounded-full border border-brand-gold/40 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.25em] text-brand-gold">
                  {t(dict, "menu.chefsSpecial")}
                </span>
              ) : null}
            </div>
            {spiceLevel > 0 ? (
              <div className="text-xs text-brand-gold" aria-label={`Spice level ${spiceLevel} of 3`}>
                {"🌶".repeat(spiceLevel)}
              </div>
            ) : null}
          </div>
          <span className="whitespace-nowrap text-sm font-semibold text-brand-gold sm:text-base">
            {formatCurrency(item.priceMinor, item.currency)}
          </span>
        </div>
        <p className="line-clamp-2 text-sm text-brand-ink/65">{localeNormalized === "zh-CN" ? (item.descriptionZh ?? getMenuDescription(item, localeNormalized)) : getMenuDescription(item, localeNormalized)}</p>
        <div className="mt-auto flex items-center justify-between gap-3 pt-2">
          <button
            className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-ink/70 transition hover:text-brand-gold"
            onClick={() => onOpen(item)}
          >
            {t(dict, "menu.details")}
          </button>
          <button
            className="rounded-full border border-brand-gold/30 px-4 py-2 text-xs font-semibold text-brand-gold transition hover:bg-brand-gold/10 disabled:cursor-not-allowed disabled:border-brand-ink/20 disabled:text-brand-ink/40"
            onClick={() => onAdd(item, imageRef.current, image.src)}
            disabled={!item.isAvailable}
          >
            {t(dict, "menu.addToCart")}
          </button>
        </div>
      </div>
    </article>
  );
});

function MobileCategoryTabs({
  categories,
  activeCategory,
  onChange
}: {
  categories: MenuCategory[];
  activeCategory: string | null;
  onChange: (id: string) => void;
}) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-1">
      {categories.map((category) => (
        <button
          key={category.id}
          onClick={() => onChange(category.id)}
          className={`whitespace-nowrap rounded-full border px-4 py-2 text-xs font-semibold transition ${
            activeCategory === category.id
              ? "border-brand-gold bg-brand-gold text-black"
              : "border-brand-gold/30 text-brand-ink/70"
          }`}
        >
          {category.name}
        </button>
      ))}
    </div>
  );
}

function MobileStickyCTA({
  item,
  onAdd,
  onOpen,
  dict
}: {
  item: MenuItem | null;
  onAdd: (item: MenuItem) => void;
  onOpen: (item: MenuItem) => void;
  dict: ReturnType<typeof getDictionary>;
}) {
  if (!item) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-brand-gold/10 bg-brand-obsidian/90 p-4 shadow-crisp sm:hidden">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
        <div>
          <p className="text-xs text-brand-ink/60">{t(dict, "menu.selected")}</p>
          <p className="text-base font-semibold text-brand-ink">{item.name}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onOpen(item)}
            className="rounded-full border border-brand-gold/30 px-3 py-2 text-xs font-semibold text-brand-gold"
          >
            {t(dict, "menu.details")}
          </button>
          <button
            onClick={() => onAdd(item)}
            className="rounded-full bg-brand-gold px-3 py-2 text-xs font-semibold text-black disabled:cursor-not-allowed disabled:bg-brand-gold/40"
            disabled={!item.isAvailable}
          >
            {t(dict, "menu.addToCart")}
          </button>
        </div>
      </div>
    </div>
  );
}

function formatCurrency(amountMinor: number, currency: string) {
  const formatter = new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency
  });
  return formatter.format(amountMinor / 100);
}

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
        {t(dict, "menu.showingPage").replace("{current}", String(currentPage)).replace("{total}", String(totalPages))}
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

function getMenuImage(title: string): MenuImage {
  return resolveMenuImage(title);
}

function getMenuDescription(item: MenuItem, localeNormalized?: string) {
  if (item.description && item.description.trim()) return item.description;

  const name = item.name.toLowerCase();
  const zh = localeNormalized === "zh-CN";

  if (name.includes("dumpling")) {
    return zh
      ? "手工包制的饺子，内馅鲜香，蒸制后口感细腻。"
      : "Hand-folded dumplings filled with seasoned pork and napa cabbage, delicately steamed.";
  }
  if (name.includes("noodle")) {
    return zh
      ? "新鲜小麦面拌上浓郁咸香的酱汁，搭配爽脆蔬菜。"
      : "Fresh wheat noodles tossed in a rich, savory sauce with crisp vegetables.";
  }
  if (name.includes("fried") && name.includes("rice")) {
    return zh
      ? "锅气十足的炒饭，配鸡蛋、葱花和传统调味。"
      : "Fragrant wok-fried rice with eggs, scallions, and traditional seasoning.";
  }
  if (name.includes("rice")) {
    return zh
      ? "锅气十足的炒饭，配鸡蛋、葱花和传统调味。"
      : "Fragrant wok-fried rice with eggs, scallions, and traditional seasoning.";
  }
  if (name.includes("duck")) {
    return zh
      ? "鸭皮酥脆，风味醇厚，收尾酱汁精致。"
      : "Crisp-skinned duck with rich, savory notes and a refined finishing glaze.";
  }
  if (name.includes("shrimp") || name.includes("prawn")) {
    return zh
      ? "鲜嫩虾肉裹着清雅酱汁，带有柔和辛香和柑橘清意。"
      : "Succulent shrimp in a light, fragrant sauce with gentle spice and citrus lift.";
  }
  if (name.includes("chicken")) {
    return zh
      ? "鸡肉嫩滑，搭配锅香与平衡香辣，收尾如丝般顺滑。"
      : "Tender chicken finished with wok aromatics, balanced spice, and a silky glaze.";
  }
  if (name.includes("beef")) {
    return zh
      ? "慢火烹制的牛肉，带有深层鲜味，并以香料和香草收尾。"
      : "Slow-cooked beef with deep umami, finished with house spices and herbs.";
  }
  if (name.includes("tea") || name.includes("drink") || name.includes("bubble")) {
    return zh
      ? "精心冲泡的传统茶饮，口感顺滑，香气悠长。"
      : "Carefully brewed traditional tea with smooth, aromatic notes.";
  }

  return zh
    ? "主厨精心打造的招牌菜，层次丰富，香气、口感与风味都恰到好处。"
    : "A chef-crafted signature, layered with aroma, texture, and elegant flavor.";
}

function isChefsSpecial(item: MenuItem) {
  const name = item.name.toLowerCase();
  return name.includes("chef") || name.includes("special") || name.includes("signature");
}

function getSpiceLevel(item: MenuItem) {
  const text = `${item.name} ${item.description ?? ""}`.toLowerCase();

  if (text.includes("mala") || text.includes("szechuan")) {
    return 3;
  }
  if (text.includes("hot") || text.includes("extra spicy") || text.includes("fiery")) {
    return 2;
  }
  if (text.includes("spicy") || text.includes("chili") || text.includes("chilli") || text.includes("pepper")) {
    return 1;
  }

  return 0;
}

function scrollToCategory(id: string) {
  const target = document.getElementById(id);
  if (!target) return;
  target.scrollIntoView({ behavior: "smooth", block: "start" });
}

function pulseCartIcon() {
  if (typeof document === "undefined") return;
  const target = document.getElementById("cart-icon");
  if (!target) return;
  target.classList.remove("cart-pulse");
  void target.offsetWidth;
  target.classList.add("cart-pulse");
}

function animateFlyToCart(imageUrl: string, sourceEl: HTMLDivElement) {
  if (typeof window === "undefined") return;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduceMotion) return;

  const target = document.getElementById("cart-icon");
  if (!target) return;

  const sourceRect = sourceEl.getBoundingClientRect();
  const targetRect = target.getBoundingClientRect();

  const clone = document.createElement("div");
  clone.style.position = "fixed";
  clone.style.left = `${sourceRect.left}px`;
  clone.style.top = `${sourceRect.top}px`;
  clone.style.width = `${sourceRect.width}px`;
  clone.style.height = `${sourceRect.height}px`;
  clone.style.borderRadius = "16px";
  clone.style.backgroundImage = `url(${imageUrl})`;
  clone.style.backgroundSize = "cover";
  clone.style.backgroundPosition = "center";
  clone.style.boxShadow = "0 20px 40px rgba(0, 0, 0, 0.4)";
  clone.style.zIndex = "9999";
  clone.style.pointerEvents = "none";

  document.body.appendChild(clone);

  const dx =
    targetRect.left + targetRect.width / 2 - (sourceRect.left + sourceRect.width / 2);
  const dy =
    targetRect.top + targetRect.height / 2 - (sourceRect.top + sourceRect.height / 2);

  const animation = clone.animate(
    [
      { transform: "translate3d(0, 0, 0) scale(1)", opacity: 1 },
      { transform: `translate3d(${dx}px, ${dy}px, 0) scale(0.2)`, opacity: 0.2 }
    ],
    {
      duration: 500,
      easing: "cubic-bezier(0.2, 0.6, 0.2, 1)"
    }
  );

  animation.onfinish = () => {
    clone.remove();
  };
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
