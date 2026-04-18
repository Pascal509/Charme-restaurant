"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Container from "@/components/layout/Container";
import { useCartStore } from "@/store/useCartStore";

const CART_ENDPOINT = "/api/cart";
const CART_ITEM_ENDPOINT = "/api/cart/item";

type CartItem = {
  id: string;
  menuItemId?: string | null;
  productVariantId?: string | null;
  quantity: number;
  unitAmountMinor: number;
  totalAmountMinor: number;
  currency: string;
  selectedOptions?: { optionIds?: string[] } | null;
};

type CartResponse = {
  cart?: {
    id: string;
    subtotalAmountMinor: number;
    totalAmountMinor: number;
    currency: string;
    items: CartItem[];
  } | null;
};

type MenuItem = {
  id: string;
  name: string;
  description?: string | null;
  priceMinor: number;
  currency: string;
  imageUrl?: string | null;
  isAvailable: boolean;
};

type MenuCategory = {
  id: string;
  name: string;
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

type CouponTotals = {
  subtotalAmountMinor: number;
  discountAmountMinor: number;
  totalAmountMinor: number;
  currency: string;
};

type CouponApplyResponse = {
  success?: boolean;
  valid?: boolean;
  code?: string;
  message?: string;
  error?: string;
  discountAmountMinor?: number;
  totals?: CouponTotals;
  currency?: string;
};

export default function CartPage() {
  const [guestId, setGuestId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [couponCode, setCouponCode] = useState("");
  const [couponTotals, setCouponTotals] = useState<CouponTotals | null>(null);
  const [couponMessage, setCouponMessage] = useState<string | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const { setItemCount } = useCartStore();
  const queryClient = useQueryClient();

  useEffect(() => {
    const id = resolveGuestId();
    if (id) setGuestId(id);
  }, []);

  const menuQuery = useQuery<MenuResponse>({
    queryKey: ["menu"],
    queryFn: async () => {
      const response = await fetch("/api/menu");
      if (!response.ok) throw new Error("Failed to load menu");
      return response.json();
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false
  });

  const promotionsQuery = useQuery<PromotionsResponse>({
    queryKey: ["promotions"],
    queryFn: async () => {
      const response = await fetch("/api/promotions/active");
      if (!response.ok) return { promotions: [] };
      return response.json();
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false
  });

  const cartQuery = useQuery<CartResponse>({
    queryKey: ["cart", guestId],
    enabled: Boolean(guestId),
    queryFn: async () => {
      const response = await fetch(`${CART_ENDPOINT}?guestId=${guestId}`);
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || "Failed to load cart");
      }
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

  const itemsById = useMemo(() => {
    const map = new Map<string, MenuItem>();
    menuQuery.data?.categories.forEach((category) => {
      category.items.forEach((item) => map.set(item.id, item));
    });
    return map;
  }, [menuQuery.data]);

  const updateMutation = useMutation({
    mutationFn: async (payload: { id: string; quantity: number }) => {
      const response = await fetch(`${CART_ITEM_ENDPOINT}/${payload.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity: payload.quantity })
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || "Failed to update item");
      }

      return response.json();
    },
    onMutate: async (payload) => {
      setErrorMessage(null);
      await queryClient.cancelQueries({ queryKey: ["cart", guestId] });

      const previous = queryClient.getQueryData<CartResponse>(["cart", guestId]);
      if (!previous?.cart) return { previous };

      const nextItems = previous.cart.items.map((item) =>
        item.id === payload.id
          ? {
              ...item,
              quantity: payload.quantity,
              totalAmountMinor: item.unitAmountMinor * payload.quantity
            }
          : item
      );

      const totals = computeTotals(nextItems, previous.cart.currency);

      queryClient.setQueryData<CartResponse>(["cart", guestId], {
        cart: {
          ...previous.cart,
          items: nextItems,
          subtotalAmountMinor: totals.subtotalAmountMinor,
          totalAmountMinor: totals.totalAmountMinor
        }
      });

      return { previous };
    },
    onError: (error, _payload, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["cart", guestId], context.previous);
      }
      setErrorMessage(error instanceof Error ? error.message : "Failed to update item");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["cart", guestId] });
    }
  });

  const removeMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`${CART_ITEM_ENDPOINT}/${id}`, {
        method: "DELETE"
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || "Failed to remove item");
      }

      return response.json();
    },
    onMutate: async (id) => {
      setErrorMessage(null);
      await queryClient.cancelQueries({ queryKey: ["cart", guestId] });
      const previous = queryClient.getQueryData<CartResponse>(["cart", guestId]);
      if (!previous?.cart) return { previous };

      const nextItems = previous.cart.items.filter((item) => item.id !== id);
      const totals = computeTotals(nextItems, previous.cart.currency);

      queryClient.setQueryData<CartResponse>(["cart", guestId], {
        cart: {
          ...previous.cart,
          items: nextItems,
          subtotalAmountMinor: totals.subtotalAmountMinor,
          totalAmountMinor: totals.totalAmountMinor
        }
      });

      return { previous };
    },
    onError: (error, _payload, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["cart", guestId], context.previous);
      }
      setErrorMessage(error instanceof Error ? error.message : "Failed to remove item");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["cart", guestId] });
    }
  });

  const applyCouponMutation = useMutation({
    mutationFn: async () => {
      if (!guestId) throw new Error("Missing guest id");
      const response = await fetch("/api/coupons/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guestId, code: couponCode.trim() })
      });

      const payload = (await response.json().catch(() => ({}))) as CouponApplyResponse;
      if (!response.ok || payload.error || payload.success === false || payload.valid === false) {
        throw new Error(payload.error || payload.message || "Invalid coupon code");
      }

      return payload;
    },
    onSuccess: (payload) => {
      const totals = resolveCouponTotals(payload, cartQuery.data?.cart);
      setCouponTotals(totals);
      setCouponMessage(payload.message || "Coupon applied.");
      setCouponError(null);
    },
    onError: (error) => {
      setCouponError(error instanceof Error ? error.message : "Failed to apply coupon");
      setCouponMessage(null);
      setCouponTotals(null);
    }
  });

  const cart = cartQuery.data?.cart ?? null;
  const empty = !cart || cart.items.length === 0;
  const effectiveTotals = resolveEffectiveTotals(cart, couponTotals);

  const activePromotions = useMemo(() => {
    const promotions = promotionsQuery.data?.promotions ?? [];
    if (!cart) return promotions;
    const ids = new Set(cart.items.map((item) => item.menuItemId).filter(Boolean) as string[]);
    return promotions.filter((promo) =>
      Array.isArray(promo.menuItemIds)
        ? promo.menuItemIds.some((id) => ids.has(id))
        : true
    );
  }, [cart, promotionsQuery.data]);

  return (
    <main className="bg-brand-rice">
      <Container className="py-10">
        <div className="flex flex-col gap-4">
          <p className="text-xs uppercase tracking-[0.3em] text-brand-ink/60">Your cart</p>
          <h1 className="font-display text-3xl text-brand-ink sm:text-4xl">Finalize your order</h1>
          <p className="max-w-2xl text-sm text-brand-ink/70">
            Review items, adjust quantities, and proceed when you are ready.
          </p>
        </div>
      </Container>

      <section className="border-t border-brand-ink/10">
        <Container className="py-8">
          {cartQuery.isLoading ? (
            <CartSkeleton />
          ) : cartQuery.isError ? (
            <div className="rounded-lg border border-brand-ink/10 bg-white p-6 text-sm text-brand-ink/70">
              Unable to load cart. Please try again.
            </div>
          ) : empty ? (
            <EmptyState />
          ) : (
            <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
              <div className="space-y-6">
                {errorMessage ? (
                  <div className="rounded-lg border border-brand-cinnabar/30 bg-white px-4 py-3 text-sm text-brand-cinnabar">
                    {errorMessage}
                  </div>
                ) : null}

                {cart?.items.map((item) => {
                  const menuItem = item.menuItemId ? itemsById.get(item.menuItemId) : undefined;
                  const name = menuItem?.name ?? "Item";
                  const description = menuItem?.description ?? "";
                  const imageUrl = menuItem?.imageUrl ?? null;
                  const unavailable = menuItem ? !menuItem.isAvailable : false;

                  return (
                    <div
                      key={item.id}
                      className="flex flex-col gap-4 rounded-lg border border-brand-ink/10 bg-white p-4 shadow-soft sm:flex-row"
                    >
                      <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-md bg-brand-ink/5">
                        {imageUrl ? (
                          <Image
                            src={imageUrl}
                            alt={name}
                            fill
                            sizes="96px"
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-xs text-brand-ink/50">
                            No image
                          </div>
                        )}
                      </div>
                      <div className="flex flex-1 flex-col gap-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="text-base font-semibold text-brand-ink">{name}</h3>
                            {description ? (
                              <p className="text-sm text-brand-ink/60">{description}</p>
                            ) : null}
                            {unavailable ? (
                              <p className="mt-1 text-xs text-brand-cinnabar">Unavailable</p>
                            ) : null}
                          </div>
                          <span className="text-sm font-semibold text-brand-ink">
                            {formatCurrency(item.totalAmountMinor, item.currency)}
                          </span>
                        </div>

                        {renderOptions(item.selectedOptions)}

                        <div className="flex flex-wrap items-center gap-3">
                          <div className="flex items-center gap-2 rounded-full border border-brand-ink/20 px-3 py-1 text-sm">
                            <button
                              onClick={() => updateMutation.mutate({ id: item.id, quantity: item.quantity - 1 })}
                              disabled={item.quantity <= 1 || updateMutation.isPending}
                              className="text-brand-ink/70"
                            >
                              -
                            </button>
                            <span className="min-w-[24px] text-center font-semibold text-brand-ink">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateMutation.mutate({ id: item.id, quantity: item.quantity + 1 })}
                              disabled={updateMutation.isPending}
                              className="text-brand-ink/70"
                            >
                              +
                            </button>
                          </div>
                          <button
                            onClick={() => removeMutation.mutate(item.id)}
                            disabled={removeMutation.isPending}
                            className="text-xs font-semibold text-brand-cinnabar"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <aside className="hidden lg:block">
                <div className="sticky top-24 space-y-4 rounded-lg border border-brand-ink/10 bg-white p-5 shadow-crisp">
                  <SummaryCard
                    cart={cart}
                    effectiveTotals={effectiveTotals}
                    promotions={activePromotions}
                    couponCode={couponCode}
                    setCouponCode={setCouponCode}
                    onApplyCoupon={() => applyCouponMutation.mutate()}
                    isApplyingCoupon={applyCouponMutation.isPending}
                    couponMessage={couponMessage}
                    couponError={couponError}
                    onClearCoupon={() => {
                      setCouponTotals(null);
                      setCouponMessage(null);
                      setCouponError(null);
                    }}
                  />
                </div>
              </aside>
            </div>
          )}
        </Container>
      </section>

      {!empty && cart ? (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-brand-ink/10 bg-brand-rice/95 p-4 shadow-crisp lg:hidden">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
            <div>
              <p className="text-xs text-brand-ink/60">Total</p>
              <p className="text-base font-semibold text-brand-ink">
                {formatCurrency(effectiveTotals.totalAmountMinor, effectiveTotals.currency)}
              </p>
            </div>
            <Link
              href={`/${resolveLocale()}/${resolveCountry()}/checkout`}
              className="rounded-md bg-brand-cinnabar px-4 py-2 text-sm font-semibold text-white"
            >
              Proceed to Checkout
            </Link>
          </div>
        </div>
      ) : null}
    </main>
  );
}

function SummaryCard({
  cart,
  effectiveTotals,
  promotions,
  couponCode,
  setCouponCode,
  onApplyCoupon,
  isApplyingCoupon,
  couponMessage,
  couponError,
  onClearCoupon
}: {
  cart: NonNullable<CartResponse["cart"]>;
  effectiveTotals: CouponTotals;
  promotions: Promotion[];
  couponCode: string;
  setCouponCode: (next: string) => void;
  onApplyCoupon: () => void;
  isApplyingCoupon: boolean;
  couponMessage: string | null;
  couponError: string | null;
  onClearCoupon: () => void;
}) {
  const deliveryFee = Math.max(cart.totalAmountMinor - cart.subtotalAmountMinor, 0);
  const discountAmount = Math.max(effectiveTotals.discountAmountMinor, 0);

  return (
    <div className="space-y-3">
      {promotions.length > 0 ? (
        <div className="rounded-md border border-brand-ink/10 bg-brand-rice px-3 py-2 text-xs text-brand-ink/70">
          <p className="text-[11px] uppercase tracking-[0.2em] text-brand-ink/40">
            Active promotions
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {promotions.map((promo) => (
              <span key={promo.id} className="rounded-full bg-white px-2 py-1 text-[11px]">
                {promo.discountPercent ? `${promo.discountPercent}% OFF` : promo.label || "Special"}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      <div className="rounded-md border border-brand-ink/10 bg-white px-3 py-3">
        <label className="text-xs uppercase tracking-[0.2em] text-brand-ink/50">Coupon</label>
        <div className="mt-2 flex gap-2">
          <input
            value={couponCode}
            onChange={(event) => setCouponCode(event.target.value)}
            placeholder="Enter code"
            className="w-full rounded-md border border-brand-ink/15 px-3 py-2 text-sm text-brand-ink"
          />
          <button
            onClick={onApplyCoupon}
            disabled={!couponCode.trim() || isApplyingCoupon}
            className="rounded-md bg-brand-ink px-3 py-2 text-xs font-semibold text-white"
          >
            {isApplyingCoupon ? "Applying" : "Apply"}
          </button>
        </div>
        {couponMessage ? (
          <div className="mt-2 flex items-center justify-between gap-2 text-xs text-emerald-700">
            <span>{couponMessage}</span>
            <button onClick={onClearCoupon} className="text-[11px] uppercase tracking-[0.2em]">
              Clear
            </button>
          </div>
        ) : null}
        {couponError ? <p className="mt-2 text-xs text-brand-cinnabar">{couponError}</p> : null}
      </div>

      <div className="flex items-center justify-between text-sm text-brand-ink/70">
        <span>Subtotal</span>
        <span>{formatCurrency(cart.subtotalAmountMinor, cart.currency)}</span>
      </div>
      <div className="flex items-center justify-between text-sm text-brand-ink/70">
        <span>Delivery fee</span>
        <span>{deliveryFee > 0 ? formatCurrency(deliveryFee, cart.currency) : "TBD"}</span>
      </div>
      {discountAmount > 0 ? (
        <div className="flex items-center justify-between text-sm text-emerald-700">
          <span>Discount</span>
          <span>-{formatCurrency(discountAmount, effectiveTotals.currency)}</span>
        </div>
      ) : null}
      <div className="flex items-center justify-between border-t border-brand-ink/10 pt-3 text-base font-semibold text-brand-ink">
        <span>Total</span>
        <span>{formatCurrency(effectiveTotals.totalAmountMinor, effectiveTotals.currency)}</span>
      </div>
      <Link
        href={`/${resolveLocale()}/${resolveCountry()}/checkout`}
        className="block rounded-md bg-brand-cinnabar px-4 py-2 text-center text-sm font-semibold text-white"
      >
        Proceed to Checkout
      </Link>
    </div>
  );
}

function CartSkeleton() {
  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="h-28 rounded-lg bg-brand-ink/10" />
        ))}
      </div>
      <div className="hidden lg:block">
        <div className="h-48 rounded-lg bg-brand-ink/10" />
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-lg border border-brand-ink/10 bg-white p-6 text-center text-sm text-brand-ink/70">
      <p className="text-base font-semibold text-brand-ink">Your cart is empty</p>
      <p className="mt-2">Browse the menu and add items to get started.</p>
      <Link
        href={`/${resolveLocale()}/${resolveCountry()}/menu`}
        className="mt-4 inline-flex rounded-md bg-brand-cinnabar px-4 py-2 text-sm font-semibold text-white"
      >
        Explore Menu
      </Link>
    </div>
  );
}

function renderOptions(selectedOptions?: { optionIds?: string[] } | null) {
  const optionIds = selectedOptions?.optionIds ?? [];
  if (optionIds.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 text-xs text-brand-ink/60">
      {optionIds.map((id) => (
        <span key={id} className="rounded-full bg-brand-ink/5 px-2 py-1">
          {id}
        </span>
      ))}
    </div>
  );
}

function computeTotals(items: CartItem[], currency: string) {
  const subtotal = items.reduce((sum, item) => sum + item.totalAmountMinor, 0);
  return {
    subtotalAmountMinor: subtotal,
    totalAmountMinor: subtotal,
    currency
  };
}

function resolveCouponTotals(payload: CouponApplyResponse, cart: CartResponse["cart"] | null) {
  if (payload.totals) {
    return {
      ...payload.totals,
      discountAmountMinor:
        payload.totals.discountAmountMinor ?? Math.max(payload.discountAmountMinor ?? 0, 0)
    };
  }

  const subtotalAmountMinor = cart?.subtotalAmountMinor ?? cart?.totalAmountMinor ?? 0;
  const baseTotal = cart?.totalAmountMinor ?? subtotalAmountMinor;
  const discountAmountMinor = Math.max(payload.discountAmountMinor ?? 0, 0);
  const currency = payload.currency || cart?.currency || "NGN";

  return {
    subtotalAmountMinor,
    discountAmountMinor,
    totalAmountMinor: Math.max(baseTotal - discountAmountMinor, 0),
    currency
  };
}

function resolveEffectiveTotals(cart: CartResponse["cart"] | null, couponTotals: CouponTotals | null) {
  if (couponTotals) return couponTotals;
  const currency = cart?.currency || "NGN";
  return {
    subtotalAmountMinor: cart?.subtotalAmountMinor ?? 0,
    discountAmountMinor: 0,
    totalAmountMinor: cart?.totalAmountMinor ?? 0,
    currency
  };
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

function resolveLocale() {
  if (typeof window === "undefined") return "en";
  const path = window.location.pathname.split("/");
  return path[1] || "en";
}

function resolveCountry() {
  if (typeof window === "undefined") return "ng";
  const path = window.location.pathname.split("/");
  return path[2] || "ng";
}
