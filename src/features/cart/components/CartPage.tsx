"use client";

import { useCallback, useEffect, useMemo, useState, memo } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Container from "@/components/layout/Container";
import ImageWrapper from "@/components/ui/ImageWrapper";
import { useCartStore } from "@/store/useCartStore";
import { getDictionary, t } from "@/lib/i18n";
import { resolveMenuImage, resolveProductImage } from "@/lib/image-resolver";

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
  menuItem?: {
    title?: string | null;
    description?: string | null;
    imageUrl?: string | null;
    isAvailable?: boolean | null;
  } | null;
  productVariant?: {
    title?: string | null;
    imageUrl?: string | null;
  } | null;
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

export default function CartPage({ locale }: { locale: string }) {
  const [guestId, setGuestId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [couponCode, setCouponCode] = useState("");
  const [couponTotals, setCouponTotals] = useState<CouponTotals | null>(null);
  const [couponMessage, setCouponMessage] = useState<string | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const { setItemCount } = useCartStore();
  const queryClient = useQueryClient();
  const dict = getDictionary(locale);

  useEffect(() => {
    const id = resolveGuestId();
    if (id) setGuestId(id);
  }, []);

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
        throw new Error(error.error || t(dict, "cart.error"));
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

  const updateMutation = useMutation({
    mutationFn: async (payload: { id: string; quantity: number }) => {
      const response = await fetch(`${CART_ITEM_ENDPOINT}/${payload.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity: payload.quantity })
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || t(dict, "messages.failedUpdateQuantity"));
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
      setErrorMessage(error instanceof Error ? error.message : t(dict, "messages.failedUpdateQuantity"));
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
        throw new Error(error.error || t(dict, "messages.failedRemoveItem"));
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
      setErrorMessage(error instanceof Error ? error.message : t(dict, "messages.failedRemoveItem"));
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["cart", guestId] });
    }
  });

  const applyCouponMutation = useMutation({
    mutationFn: async () => {
      if (!guestId) throw new Error(t(dict, "messages.noGuestId"));
      const response = await fetch("/api/coupons/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guestId, code: couponCode.trim() })
      });

      const payload = (await response.json().catch(() => ({}))) as CouponApplyResponse;
      if (!response.ok || payload.error || payload.success === false || payload.valid === false) {
        throw new Error(payload.error || payload.message || t(dict, "cart.invalidCoupon"));
      }

      return payload;
    },
    onSuccess: (payload) => {
      const totals = resolveCouponTotals(payload, cartQuery.data?.cart);
      setCouponTotals(totals);
      setCouponMessage(payload.message || t(dict, "cart.couponApplied"));
      setCouponError(null);
    },
    onError: (error) => {
      setCouponError(error instanceof Error ? error.message : t(dict, "messages.failedApplyCoupon"));
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

  const handleUpdateQuantity = useCallback(
    (itemId: string, quantity: number) => {
      updateMutation.mutate({ id: itemId, quantity });
    },
    [updateMutation]
  );

  const handleRemoveItem = useCallback(
    (itemId: string) => {
      removeMutation.mutate(itemId);
    },
    [removeMutation]
  );

  return (
    <main className="bg-brand-rice">
      <Container className="py-10">
        <div className="flex flex-col gap-4">
          <p className="text-xs uppercase tracking-[0.3em] text-brand-ink/60">{t(dict, "cart.header")}</p>
          <h1 className="font-display text-3xl text-brand-ink sm:text-4xl">{t(dict, "cart.title")}</h1>
          <p className="max-w-2xl text-sm text-brand-ink/70">{t(dict, "cart.subtitle")}</p>
        </div>
      </Container>

      <section className="border-t border-brand-ink/10">
        <Container className="py-8">
          {cartQuery.isLoading ? (
            <CartSkeleton />
          ) : cartQuery.isError ? (
            <div className="rounded-lg border border-brand-ink/10 bg-white p-6 text-sm text-brand-ink/70">
              {t(dict, "cart.error")}
            </div>
          ) : empty ? (
            <EmptyState dict={dict} />
          ) : (
            <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
              <div className="space-y-6">
                {errorMessage ? (
                  <div className="rounded-lg border border-brand-cinnabar/30 bg-white px-4 py-3 text-sm text-brand-cinnabar">
                    {errorMessage}
                  </div>
                ) : null}

                {cart?.items.map((item) => {
                  const menuItem = item.menuItem ?? undefined;
                  const productVariant = item.productVariant ?? undefined;
                  const name = menuItem?.title ?? productVariant?.title ?? t(dict, "cart.item");
                  const description = menuItem?.description ?? "";
                  const imageUrl = menuItem?.imageUrl ?? productVariant?.imageUrl ?? null;
                  const resolvedImage = imageUrl
                    ? { src: imageUrl, position: getCartImagePosition(name) }
                    : menuItem
                      ? resolveMenuImage(name)
                      : resolveProductImage(name);
                  const unavailable = menuItem ? !menuItem.isAvailable : false;

                  return (
                    <CartItemRow
                      key={item.id}
                      item={item}
                      name={name}
                      description={description}
                      resolvedImage={resolvedImage}
                      unavailable={unavailable}
                      dict={dict}
                      onUpdateQuantity={handleUpdateQuantity}
                      onRemoveItem={handleRemoveItem}
                      isUpdating={updateMutation.isPending}
                      isRemoving={removeMutation.isPending}
                    />
                  );
                })}
              </div>

              <aside className="hidden lg:block">
                <div className="sticky top-24 space-y-4 rounded-2xl border border-brand-gold/10 bg-white/5 p-6 shadow-crisp">
                  <SummaryCard
                    dict={dict}
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
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-brand-gold/10 bg-brand-obsidian/95 p-4 shadow-crisp lg:hidden">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
            <div>
              <p className="text-xs text-brand-ink/60">{t(dict, "cart.total")}</p>
              <p className="text-base font-semibold text-brand-ink">
                {formatCurrency(effectiveTotals.totalAmountMinor, effectiveTotals.currency)}
              </p>
            </div>
            <Link
              href={`/${resolveLocale()}/${resolveCountry()}/checkout`}
              className="btn btn-gold"
            >
              {t(dict, "cart.proceedCheckout")}
            </Link>
          </div>
        </div>
      ) : null}
    </main>
  );
}

function SummaryCard({
  dict,
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
  dict: ReturnType<typeof getDictionary>;
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
        <div className="rounded-xl border border-brand-gold/10 bg-black/40 px-3 py-2 text-xs text-brand-ink/70">
          <p className="text-[11px] uppercase tracking-[0.2em] text-brand-gold/60">{t(dict, "cart.activePromotions")}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {promotions.map((promo) => (
              <span
                key={promo.id}
                className="rounded-full border border-brand-gold/20 bg-brand-gold/10 px-2 py-1 text-[11px] text-brand-gold"
              >
                {promo.discountPercent ? `${promo.discountPercent}% OFF` : promo.label || t(dict, "checkout.special")}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      <div className="rounded-xl border border-brand-gold/10 bg-black/40 px-3 py-3">
        <label htmlFor="cart-coupon" className="text-xs uppercase tracking-[0.2em] text-brand-gold/60">{t(dict, "cart.coupon")}</label>
        <div className="mt-2 flex gap-2">
          <input
            id="cart-coupon"
            name="cartCoupon"
            value={couponCode}
            onChange={(event) => setCouponCode(event.target.value)}
            placeholder={t(dict, "cart.couponPlaceholder")}
            className="w-full rounded-lg border border-brand-gold/10 bg-black/40 px-3 py-2 text-sm text-brand-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold/60"
          />
          <button
            type="button"
            onClick={onApplyCoupon}
            disabled={!couponCode.trim() || isApplyingCoupon}
            className="rounded-lg bg-brand-gold px-3 py-2 text-xs font-semibold text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold/60 disabled:cursor-not-allowed disabled:bg-brand-gold/40"
          >
            {isApplyingCoupon ? t(dict, "cart.applying") : t(dict, "cart.apply")}
          </button>
        </div>
        {couponMessage ? (
          <div className="mt-2 flex items-center justify-between gap-2 text-xs text-emerald-700" role="status" aria-live="polite">
            <span>{couponMessage}</span>
            <button type="button" onClick={onClearCoupon} className="text-[11px] uppercase tracking-[0.2em] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold/60">
              {t(dict, "cart.clear")}
            </button>
          </div>
        ) : null}
        {couponError ? <p className="mt-2 text-xs text-brand-cinnabar" role="alert">{couponError}</p> : null}
      </div>

      <div className="flex items-center justify-between text-sm text-brand-ink/70">
        <span>{t(dict, "cart.subtotal")}</span>
        <span>{formatCurrency(cart.subtotalAmountMinor, cart.currency)}</span>
      </div>
      <div className="flex items-center justify-between text-sm text-brand-ink/70">
        <span>{t(dict, "cart.deliveryFee")}</span>
        <span>{deliveryFee > 0 ? formatCurrency(deliveryFee, cart.currency) : t(dict, "cart.tbd")}</span>
      </div>
      {discountAmount > 0 ? (
        <div className="flex items-center justify-between text-sm text-emerald-700">
          <span>{t(dict, "cart.discount")}</span>
          <span>-{formatCurrency(discountAmount, effectiveTotals.currency)}</span>
        </div>
      ) : null}
      <div className="flex items-center justify-between border-t border-brand-gold/10 pt-3 text-base font-semibold text-brand-ink">
        <span>{t(dict, "cart.total")}</span>
        <span>{formatCurrency(effectiveTotals.totalAmountMinor, effectiveTotals.currency)}</span>
      </div>
      <Link
        href={`/${resolveLocale()}/${resolveCountry()}/checkout`}
        className="block rounded-full bg-brand-gold px-4 py-2 text-center text-sm font-semibold text-black"
      >
        {t(dict, "cart.proceedCheckout")}
      </Link>
    </div>
  );
}

function CartSkeleton() {
  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="h-28 rounded-2xl bg-brand-ink/10 skeleton" />
        ))}
      </div>
      <div className="hidden lg:block">
        <div className="h-48 rounded-2xl bg-brand-ink/10 skeleton" />
      </div>
    </div>
  );
}

function EmptyState({ dict }: { dict: ReturnType<typeof getDictionary> }) {
  return (
    <div className="rounded-2xl border border-brand-gold/10 bg-white/5 p-6 text-center text-sm text-brand-ink/70 shadow-soft">
      <p className="text-base font-semibold text-brand-ink">{t(dict, "cart.empty")}</p>
      <p className="mt-2">{t(dict, "cart.emptyMessage")}</p>
      <Link
        href={`/${resolveLocale()}/${resolveCountry()}/menu`}
        className="btn btn-gold mt-4 inline-flex"
      >
        {t(dict, "nav.menu")}
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
        <span key={id} className="rounded-full border border-brand-gold/15 bg-black/40 px-2 py-1">
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

function getCartImagePosition(name: string) {
  const text = name.toLowerCase();
  const needsTopCrop = text.includes("soup") || text.includes("noodle") || text.includes("bowl");
  return needsTopCrop ? "object-top" : "object-center";
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

const CartItemRow = memo(function CartItemRow({
  item,
  name,
  description,
  resolvedImage,
  unavailable,
  dict,
  onUpdateQuantity,
  onRemoveItem,
  isUpdating,
  isRemoving
}: {
  item: CartItem;
  name: string;
  description: string;
  resolvedImage: { src: string; position: string };
  unavailable: boolean;
  dict: ReturnType<typeof getDictionary>;
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onRemoveItem: (itemId: string) => void;
  isUpdating: boolean;
  isRemoving: boolean;
}) {
  const handleQuantityDown = useCallback(() => {
    if (item.quantity > 1) {
      onUpdateQuantity(item.id, item.quantity - 1);
    }
  }, [item.id, item.quantity, onUpdateQuantity]);

  const handleQuantityUp = useCallback(() => {
    onUpdateQuantity(item.id, item.quantity + 1);
  }, [item.id, item.quantity, onUpdateQuantity]);

  const handleQuantityChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newQty = parseInt(e.currentTarget.value);
      if (!isNaN(newQty) && newQty > 0) {
        onUpdateQuantity(item.id, newQty);
      }
    },
    [item.id, onUpdateQuantity]
  );

  const handleRemove = useCallback(() => {
    onRemoveItem(item.id);
  }, [item.id, onRemoveItem]);

  return (
    <div
      className="group card-hover flex flex-col gap-4 rounded-2xl border border-brand-gold/10 bg-white/5 p-5 shadow-soft transition duration-300 hover:-translate-y-0.5 hover:shadow-crisp sm:flex-row"
    >
      <ImageWrapper
        src={resolvedImage.src}
        alt={name}
        aspect="menu"
        sizes="96px"
        className="w-24 flex-shrink-0 rounded-xl"
        imageClassName="transition duration-300 group-hover:scale-105"
        objectPositionClassName={resolvedImage.position}
        fallbackLabel={t(dict, "checkout.noImage")}
      />
      <div className="flex flex-1 flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-display text-base font-semibold text-brand-ink sm:text-lg">
              {name}
            </h3>
            {description ? (
              <p className="text-sm text-brand-ink/60">{description}</p>
            ) : null}
            {unavailable ? (
              <p className="mt-1 text-xs text-brand-cinnabar">{t(dict, "cart.unavailable")}</p>
            ) : null}
          </div>
          <span className="text-sm font-semibold text-brand-gold">
            {formatCurrency(item.totalAmountMinor, item.currency)}
          </span>
        </div>

        {renderOptions(item.selectedOptions)}

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 rounded-full border border-brand-gold/30 px-3 py-1 text-sm">
            <button
              type="button"
              onClick={handleQuantityDown}
              disabled={item.quantity <= 1 || isUpdating}
              aria-label={`${t(dict, "market.decreaseQuantity")} ${name}`}
              className="text-brand-ink/70 transition hover:text-brand-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold/60 disabled:cursor-not-allowed"
            >
              -
            </button>
            <input
              type="number"
              min="1"
              value={item.quantity}
              onChange={handleQuantityChange}
              disabled={isUpdating}
              className="min-w-[24px] bg-transparent text-center font-semibold text-brand-ink outline-none disabled:opacity-50"
            />
            <button
              type="button"
              onClick={handleQuantityUp}
              disabled={isUpdating}
              aria-label={`${t(dict, "market.increaseQuantity")} ${name}`}
              className="text-brand-ink/70 transition hover:text-brand-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold/60 disabled:cursor-not-allowed"
            >
              +
            </button>
          </div>
          <button
            type="button"
            onClick={handleRemove}
            disabled={isRemoving}
            className="text-xs font-semibold text-brand-cinnabar transition hover:text-brand-cinnabar/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold/60 disabled:cursor-not-allowed"
          >
            {t(dict, "cart.remove")}
          </button>
        </div>
      </div>
    </div>
  );
});

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
