"use client";

import { useMemo, useState, useEffect } from "react";
import Image from "next/image";
import dynamic from "next/dynamic";
import { useMutation, useQuery } from "@tanstack/react-query";
import Container from "@/components/layout/Container";
import { useCartStore } from "@/store/useCartStore";
import type { MenuItem, SelectedMap } from "@/features/menu/types";
import { StarRatingDisplay, formatRatingLabel } from "@/features/menu/components/RatingStars";

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

type MenuResponse = {
  categories: MenuCategory[];
};

type Promotion = {
  id: string;
  label?: string | null;
  discountPercent?: number | null;
  discountAmountMinor?: number | null;
  menuItemIds?: string[] | null;
};

type PromotionsResponse = {
  promotions: Promotion[];
};

export default function MenuPage() {
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
  const { itemCount, setItemCount, incrementBy } = useCartStore();

  const menuQuery = useQuery<MenuResponse>({
    queryKey: ["menu"],
    queryFn: async () => {
      const response = await fetch("/api/menu");
      if (!response.ok) {
        throw new Error("Failed to load menu");
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true
  });

  const promotionsQuery = useQuery<PromotionsResponse>({
    queryKey: ["promotions"],
    queryFn: async () => {
      const response = await fetch("/api/promotions/active");
      if (!response.ok) {
        return { promotions: [] };
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false
  });

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

  const categories = useMemo(() => {
    const list = menuQuery.data?.categories ?? [];
    const filtered = list.filter((category) => category.isActive);
    return filtered.sort((a, b) => a.displayOrder - b.displayOrder);
  }, [menuQuery.data]);

  useEffect(() => {
    if (!activeCategory && categories.length > 0) {
      setActiveCategory(categories[0].id);
    }
  }, [activeCategory, categories]);

  const filteredCategories = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
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
  }, [categories, priceFilter, searchTerm, selectedCategoryId]);

  function handleAddToCart(item: MenuItem) {
    if (item.modifierGroups && item.modifierGroups.length > 0) {
      setSelectedItem(item);
      setSelectedOptions({});
      return;
    }

    addMutation.mutate({ menuItemId: item.id, quantity: 1, selectedOptions: [] });
  }

  function handleConfirmModifiers() {
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

    setSelectedItem(null);
    setSelectedOptions({});
  }

  function openDetail(item: MenuItem) {
    setDetailItem(item);
    setDetailQty(1);
  }

  function handleConfirmDetail() {
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
    setDetailItem(null);
  }

  const cartBadge = itemCount > 0 ? (
    <span className="ml-2 rounded-full bg-brand-jade px-2 py-0.5 text-xs font-semibold text-white">
      {itemCount}
    </span>
  ) : null;

  return (
    <main className="scroll-smooth bg-brand-rice">
      <Container className="py-10">
        <div className="flex flex-col gap-4">
          <p className="text-xs uppercase tracking-[0.3em] text-brand-ink/60">Menu</p>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="font-display text-3xl text-brand-ink sm:text-4xl">
                Curated dishes with modern indulgence
              </h1>
              <p className="mt-3 max-w-2xl text-sm text-brand-ink/70">
                Select from our seasonal categories and build the perfect order. Fresh ingredients,
                precise prep, and thoughtful pairings.
              </p>
            </div>
            <div className="flex items-center text-sm font-semibold text-brand-ink">
              Cart{cartBadge}
            </div>
          </div>
        </div>
      </Container>

      <section className="border-t border-brand-ink/10 bg-brand-rice">
        <Container className="py-8">
          {menuQuery.isLoading ? (
            <MenuSkeleton />
          ) : menuQuery.isError ? (
            <div className="rounded-lg border border-brand-ink/10 bg-white p-6 text-sm text-brand-ink/70">
              Failed to load menu. Please refresh.
            </div>
          ) : categories.length === 0 ? (
            <div className="rounded-lg border border-brand-ink/10 bg-white p-6 text-sm text-brand-ink/70">
              No menu items available right now.
            </div>
          ) : (
            <div className="grid gap-8 lg:grid-cols-[220px_1fr]">
              <aside className="hidden lg:block">
                <div className="sticky top-24 space-y-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-ink/60">
                    Categories
                  </p>
                  <nav className="flex flex-col gap-2">
                    {categories.map((category) => (
                      <button
                        key={category.id}
                        onClick={() => scrollToCategory(category.id)}
                        className={`rounded-md px-3 py-2 text-left text-sm transition ${
                          activeCategory === category.id
                            ? "bg-brand-ink text-brand-rice"
                            : "text-brand-ink/70 hover:bg-brand-ink/10"
                        }`}
                      >
                        {category.name}
                      </button>
                    ))}
                  </nav>
                </div>
              </aside>

              <div className="space-y-10">
                <div className="space-y-4">
                  <div className="grid gap-3 rounded-lg border border-brand-ink/10 bg-white p-4 shadow-soft sm:grid-cols-[1fr_200px_200px]">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-ink/60">
                        Search
                      </label>
                      <input
                        value={searchTerm}
                        onChange={(event) => setSearchTerm(event.target.value)}
                        placeholder="Search dishes, ingredients"
                        className="w-full rounded-md border border-brand-ink/10 px-3 py-2 text-sm text-brand-ink"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-ink/60">
                        Category
                      </label>
                      <select
                        value={selectedCategoryId}
                        onChange={(event) => setSelectedCategoryId(event.target.value as string)}
                        className="w-full rounded-md border border-brand-ink/10 px-3 py-2 text-sm text-brand-ink"
                      >
                        <option value="all">All</option>
                        {categories.map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-ink/60">
                        Price
                      </label>
                      <select
                        value={priceFilter}
                        onChange={(event) => setPriceFilter(event.target.value)}
                        className="w-full rounded-md border border-brand-ink/10 px-3 py-2 text-sm text-brand-ink"
                      >
                        <option value="all">All</option>
                        <option value="low">Under 5,000</option>
                        <option value="mid">5,000 - 15,000</option>
                        <option value="high">15,000+</option>
                      </select>
                    </div>
                  </div>

                  <MobileCategoryTabs
                    categories={categories}
                    activeCategory={activeCategory}
                    onChange={(id) => {
                      setActiveCategory(id);
                      scrollToCategory(id);
                    }}
                  />
                </div>

                {filteredCategories.length === 0 ? (
                  <div className="rounded-lg border border-brand-ink/10 bg-white p-6 text-sm text-brand-ink/70">
                    No items match your search. Try adjusting filters.
                  </div>
                ) : null}

                {filteredCategories.map((category) => (
                  <section key={category.id} id={category.id} className="scroll-mt-24">
                    <div className="flex items-baseline justify-between gap-4">
                      <div>
                        <h2 className="font-display text-2xl text-brand-ink">{category.name}</h2>
                        {category.description ? (
                          <p className="mt-2 text-sm text-brand-ink/60">
                            {category.description}
                          </p>
                        ) : null}
                      </div>
                    </div>
                    <div className="mt-6 grid gap-6 md:grid-cols-2">
                      {category.items.map((item) => (
                        <MenuItemCard
                          key={item.id}
                          item={item}
                          onAdd={() => handleAddToCart(item)}
                          onOpen={() => openDetail(item)}
                          onFocus={setFocusedItem}
                          promotionBadges={resolvePromotionBadges(
                            item,
                            promotionsQuery.data?.promotions ?? []
                          )}
                        />
                      ))}
                    </div>
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
        />
      ) : null}

      {detailItem ? (
        <ItemDetailModal
          item={detailItem}
          quantity={detailQty}
          onQuantityChange={setDetailQty}
          onClose={() => setDetailItem(null)}
          onConfirm={handleConfirmDetail}
        />
      ) : null}

      <MobileStickyCTA item={focusedItem} onAdd={handleAddToCart} onOpen={openDetail} />
    </main>
  );
}

function MenuItemCard({
  item,
  onAdd,
  onOpen,
  onFocus,
  promotionBadges
}: {
  item: MenuItem;
  onAdd: () => void;
  onOpen: () => void;
  onFocus: (item: MenuItem) => void;
  promotionBadges: string[];
}) {
  const badges = [...resolveBadges(item), ...promotionBadges];

  return (
    <div
      className="flex flex-col rounded-lg border border-brand-ink/10 bg-white shadow-soft"
      onMouseEnter={() => onFocus(item)}
      onTouchStart={() => onFocus(item)}
      onFocus={() => onFocus(item)}
      tabIndex={0}
    >
      <div className="relative h-44 w-full overflow-hidden rounded-t-lg bg-brand-ink/5">
        {item.imageUrl ? (
          <Image
            src={item.imageUrl}
            alt={item.name}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-brand-ink/50">
            No image
          </div>
        )}
        {badges.length > 0 ? (
          <div className="absolute left-3 top-3 flex flex-wrap gap-2">
            {badges.map((badge) => (
              <span
                key={badge}
                className="rounded-full bg-brand-ink/80 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-brand-rice"
              >
                {badge}
              </span>
            ))}
          </div>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col gap-4 p-5">
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-4">
            <h3 className="text-lg font-semibold text-brand-ink">{item.name}</h3>
            <span className="text-sm font-semibold text-brand-ink">
              {formatCurrency(item.priceMinor, item.currency)}
            </span>
          </div>
          {item.description ? (
            <p className="text-sm text-brand-ink/60">{item.description}</p>
          ) : null}
          <div className="flex items-center gap-2 text-xs text-brand-ink/60">
            <StarRatingDisplay rating={item.averageRating ?? 0} />
            <span>{formatRatingLabel(item.averageRating ?? 0, item.reviewCount ?? 0)}</span>
          </div>
          <p className={`text-xs ${item.isAvailable ? "text-brand-jade" : "text-brand-ink/50"}`}>
            {item.isAvailable ? "Available" : "Unavailable"}
          </p>
        </div>
        <div className="mt-auto flex flex-col gap-2 sm:flex-row">
          <button
            className="rounded-md border border-brand-ink/15 px-4 py-2 text-sm font-semibold text-brand-ink"
            onClick={onOpen}
          >
            View details
          </button>
          <button
            className="rounded-md bg-brand-cinnabar px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-cinnabar/90 disabled:cursor-not-allowed disabled:bg-brand-ink/20"
            onClick={onAdd}
            disabled={!item.isAvailable}
          >
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
}

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
    <div className="flex gap-3 overflow-x-auto pb-2 lg:hidden">
      {categories.map((category) => (
        <button
          key={category.id}
          onClick={() => onChange(category.id)}
          className={`whitespace-nowrap rounded-full border px-4 py-2 text-xs font-semibold transition ${
            activeCategory === category.id
              ? "border-brand-ink bg-brand-ink text-brand-rice"
              : "border-brand-ink/20 text-brand-ink/70"
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
  onOpen
}: {
  item: MenuItem | null;
  onAdd: (item: MenuItem) => void;
  onOpen: (item: MenuItem) => void;
}) {
  if (!item) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-brand-ink/10 bg-brand-rice/95 p-4 shadow-crisp sm:hidden">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
        <div>
          <p className="text-xs text-brand-ink/60">Selected</p>
          <p className="text-base font-semibold text-brand-ink">{item.name}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onOpen(item)}
            className="rounded-md border border-brand-ink/20 px-3 py-2 text-xs font-semibold text-brand-ink"
          >
            Details
          </button>
          <button
            onClick={() => onAdd(item)}
            className="rounded-md bg-brand-cinnabar px-3 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:bg-brand-cinnabar/60"
            disabled={!item.isAvailable}
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
}

function MenuSkeleton() {
  return (
    <div className="grid gap-8 lg:grid-cols-[220px_1fr]">
      <div className="hidden lg:block">
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-10 rounded-md bg-brand-ink/10" />
          ))}
        </div>
      </div>
      <div className="space-y-8">
        {Array.from({ length: 2 }).map((_, section) => (
          <div key={section} className="space-y-4">
            <div className="h-6 w-48 rounded bg-brand-ink/10" />
            <div className="grid gap-6 md:grid-cols-2">
              {Array.from({ length: 4 }).map((_, card) => (
                <div key={card} className="h-64 rounded-lg bg-brand-ink/10" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function resolveBadges(item: MenuItem) {
  const badges: string[] = [];
  if (item.isAvailable && item.preparationTime && item.preparationTime <= 15) {
    badges.push("Popular");
  }
  if (item.isAvailable && item.preparationTime && item.preparationTime >= 25) {
    badges.push("Chef's Special");
  }
  return badges;
}

function resolvePromotionBadges(item: MenuItem, promotions: Promotion[]) {
  return promotions
    .filter((promo) => Array.isArray(promo.menuItemIds) && promo.menuItemIds.includes(item.id))
    .map((promo) => {
      if (promo.discountPercent) {
        return `${promo.discountPercent}% OFF`;
      }
      if (promo.label) {
        return promo.label;
      }
      return "Special";
    });
}

function formatCurrency(amountMinor: number, currency: string) {
  const formatter = new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency
  });
  return formatter.format(amountMinor / 100);
}

function scrollToCategory(id: string) {
  const target = document.getElementById(id);
  if (!target) return;
  target.scrollIntoView({ behavior: "smooth", block: "start" });
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
