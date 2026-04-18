"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Container from "@/components/layout/Container";
import { useCartStore } from "@/store/useCartStore";
import CheckoutAddressSection from "@/features/checkout/components/CheckoutAddressSection";
import { useUserIdentity } from "@/hooks/useUserIdentity";
import type {
  CartValidationResponse,
  CheckoutSessionResponse
} from "@/features/checkout/types";

const CART_ENDPOINT = "/api/cart";
const CART_VALIDATE_ENDPOINT = "/api/cart/validate";
const CHECKOUT_SESSION_ENDPOINT = "/api/checkout/session";

type CartItem = {
  id: string;
  menuItemId?: string | null;
  quantity: number;
  unitAmountMinor: number;
  totalAmountMinor: number;
  currency: string;
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

type FulfillmentType = "DELIVERY" | "PICKUP";

type PaymentProvider = "STRIPE" | "FLUTTERWAVE";

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

type CheckoutTotals = {
  subtotalAmountMinor: number;
  taxAmountMinor: number;
  deliveryAmountMinor: number;
  discountAmountMinor?: number;
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
  totals?: CheckoutTotals;
  currency?: string;
};

export default function CheckoutPage() {
  const [guestId, setGuestId] = useState<string | null>(null);
  const { userId } = useUserIdentity();
  const [fulfillmentType, setFulfillmentType] = useState<FulfillmentType>("PICKUP");
  const [paymentProvider, setPaymentProvider] = useState<PaymentProvider>("STRIPE");
  const [addressId, setAddressId] = useState<string | null>(null);
  const [pickupSlotId, setPickupSlotId] = useState<string>("");
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [validationTotals, setValidationTotals] = useState<CartValidationResponse["totals"]>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [addressLoginRequired, setAddressLoginRequired] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [couponTotals, setCouponTotals] = useState<CheckoutTotals | null>(null);
  const [couponMessage, setCouponMessage] = useState<string | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const { setItemCount } = useCartStore();
  const queryClient = useQueryClient();

  useEffect(() => {
    const id = resolveGuestId();
    if (id) setGuestId(id);
  }, []);

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

  useEffect(() => {
    const count = cartQuery.data?.cart?.items?.reduce((sum, item) => sum + item.quantity, 0) ?? 0;
    setItemCount(count);
  }, [cartQuery.data, setItemCount]);

  const validateMutation = useMutation({
    mutationFn: async () => {
      if (!guestId) throw new Error("Missing guest id");

      const response = await fetch(CART_VALIDATE_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guestId,
          userId: userId || undefined,
          fulfillmentType,
          paymentProvider,
          addressId: fulfillmentType === "DELIVERY" ? addressId || undefined : undefined,
          pickupSlotId: fulfillmentType === "PICKUP" ? pickupSlotId || undefined : undefined
        })
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || "Failed to validate cart");
      }

      return response.json() as Promise<CartValidationResponse>;
    },
    onSuccess: (payload) => {
      setValidationErrors(payload.errors ?? []);
      setValidationTotals(payload.totals ?? null);
    },
    onError: (error) => {
      setValidationErrors([
        error instanceof Error ? error.message : "Failed to validate cart"
      ]);
      setValidationTotals(null);
    }
  });

  const checkoutMutation = useMutation({
    mutationFn: async () => {
      if (!guestId) throw new Error("Missing guest id");

      const response = await fetch(CHECKOUT_SESSION_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guestId,
          userId: userId || undefined,
          fulfillmentType,
          paymentProvider,
          addressId: fulfillmentType === "DELIVERY" ? addressId || undefined : undefined,
          pickupSlotId: fulfillmentType === "PICKUP" ? pickupSlotId || undefined : undefined,
          idempotencyKey: generateIdempotencyKey()
        })
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || "Failed to create checkout session");
      }

      return response.json() as Promise<CheckoutSessionResponse>;
    }
  });

  const applyCouponMutation = useMutation({
    mutationFn: async () => {
      if (!guestId) throw new Error("Missing guest id");
      const response = await fetch("/api/coupons/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guestId, userId: userId || undefined, code: couponCode.trim() })
      });

      const payload = (await response.json().catch(() => ({}))) as CouponApplyResponse;
      if (!response.ok || payload.error || payload.success === false || payload.valid === false) {
        throw new Error(payload.error || payload.message || "Invalid coupon code");
      }

      return payload;
    },
    onSuccess: (payload) => {
      const totals = resolveCheckoutCouponTotals(payload, validationTotals);
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
  const displayTotals = couponTotals ?? (validationTotals as CheckoutTotals | null);

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

  const itemsCount = useMemo(
    () => cart?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0,
    [cart]
  );

  useEffect(() => {
    if (!cart || !guestId) return;

    validateMutation.mutate();
  }, [cart, fulfillmentType, paymentProvider, addressId, pickupSlotId, guestId, validateMutation]);

  useEffect(() => {
    setCouponTotals(null);
    setCouponMessage(null);
    setCouponError(null);
  }, [fulfillmentType, paymentProvider, addressId, pickupSlotId]);

  async function handlePlaceOrder() {
    setCheckoutError(null);

    if (fulfillmentType === "DELIVERY" && addressLoginRequired) {
      setCheckoutError("Sign in to use delivery addresses and validate coverage.");
      return;
    }

    if (fulfillmentType === "DELIVERY" && !addressId) {
      setCheckoutError("Please select or add a delivery address.");
      return;
    }

    const validation = await validateMutation.mutateAsync().catch(() => null);
    if (!validation || !validation.valid) {
      setCheckoutError("Please resolve validation issues before placing the order.");
      return;
    }

    const session = await checkoutMutation.mutateAsync().catch((error) => {
      setCheckoutError(error instanceof Error ? error.message : "Failed to start checkout");
      return null;
    });

    if (!session?.checkoutUrl) {
      setCheckoutError("Payment session could not be created. Please try again.");
      return;
    }

    setItemCount(0);
    queryClient.invalidateQueries({ queryKey: ["cart", guestId] });
    window.location.href = session.checkoutUrl;
  }

  return (
    <main className="bg-brand-rice">
      <Container className="py-10">
        <div className="flex flex-col gap-4">
          <p className="text-xs uppercase tracking-[0.3em] text-brand-ink/60">Checkout</p>
          <h1 className="font-display text-3xl text-brand-ink sm:text-4xl">Complete your order</h1>
          <p className="max-w-2xl text-sm text-brand-ink/70">
            Confirm fulfillment details, review totals, and continue to payment.
          </p>
        </div>
      </Container>

      <section className="border-t border-brand-ink/10">
        <Container className="py-8">
          {cartQuery.isLoading ? (
            <CheckoutSkeleton />
          ) : cartQuery.isError ? (
            <div className="rounded-lg border border-brand-ink/10 bg-white p-6 text-sm text-brand-ink/70">
              Unable to load checkout. Please try again.
            </div>
          ) : empty ? (
            <EmptyState />
          ) : (
            <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
              <div className="space-y-6">
                <div className="rounded-lg border border-brand-ink/10 bg-white p-6 shadow-soft">
                  <h2 className="text-lg font-semibold text-brand-ink">Fulfillment</h2>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <label className="flex items-center gap-3 rounded-md border border-brand-ink/10 px-3 py-3">
                      <input
                        type="radio"
                        name="fulfillmentType"
                        value="PICKUP"
                        checked={fulfillmentType === "PICKUP"}
                        onChange={() => setFulfillmentType("PICKUP")}
                      />
                      <div>
                        <p className="text-sm font-semibold text-brand-ink">Pickup</p>
                        <p className="text-xs text-brand-ink/60">Collect from the restaurant</p>
                      </div>
                    </label>
                    <label className="flex items-center gap-3 rounded-md border border-brand-ink/10 px-3 py-3">
                      <input
                        type="radio"
                        name="fulfillmentType"
                        value="DELIVERY"
                        checked={fulfillmentType === "DELIVERY"}
                        onChange={() => setFulfillmentType("DELIVERY")}
                      />
                      <div>
                        <p className="text-sm font-semibold text-brand-ink">Delivery</p>
                        <p className="text-xs text-brand-ink/60">We will bring it to you</p>
                      </div>
                    </label>
                  </div>

                  {fulfillmentType === "DELIVERY" ? (
                    <div className="mt-4">
                      <CheckoutAddressSection
                        onSelectAddress={(nextId, requiresLogin) => {
                          setAddressId(nextId);
                          setAddressLoginRequired(requiresLogin);
                        }}
                      />
                    </div>
                  ) : (
                    <div className="mt-4 grid gap-3">
                      <label className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-ink/60">
                        Pickup Slot
                      </label>
                      <input
                        value={pickupSlotId}
                        onChange={(event) => setPickupSlotId(event.target.value)}
                        placeholder="Pickup slot ID (optional)"
                        className="rounded-md border border-brand-ink/10 px-3 py-2 text-sm text-brand-ink"
                      />
                    </div>
                  )}
                </div>

                <div className="rounded-lg border border-brand-ink/10 bg-white p-6 shadow-soft">
                  <h2 className="text-lg font-semibold text-brand-ink">Payment</h2>
                  <div className="mt-4 grid gap-3">
                    <label className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-ink/60">
                      Provider
                    </label>
                    <select
                      value={paymentProvider}
                      onChange={(event) => setPaymentProvider(event.target.value as PaymentProvider)}
                      className="rounded-md border border-brand-ink/10 px-3 py-2 text-sm text-brand-ink"
                    >
                      <option value="STRIPE">Stripe</option>
                      <option value="FLUTTERWAVE">Flutterwave</option>
                    </select>
                  </div>
                </div>
              </div>

              <aside>
                <div className="sticky top-24 space-y-4 rounded-lg border border-brand-ink/10 bg-white p-5 shadow-crisp">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-brand-ink">Order summary</h2>
                    <span className="text-xs text-brand-ink/60">{itemsCount} items</span>
                  </div>

                  {validationErrors.length > 0 ? (
                    <div className="rounded-md border border-brand-cinnabar/30 bg-brand-cinnabar/5 px-3 py-2 text-sm text-brand-cinnabar">
                      <p className="font-semibold">We need your attention</p>
                      <ul className="mt-2 list-disc space-y-1 pl-4 text-xs">
                        {validationErrors.map((error) => (
                          <li key={error}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  {activePromotions.length > 0 ? (
                    <div className="rounded-md border border-brand-ink/10 bg-brand-rice px-3 py-2 text-xs text-brand-ink/70">
                      <p className="text-[11px] uppercase tracking-[0.2em] text-brand-ink/40">
                        Active promotions
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {activePromotions.map((promo) => (
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
                        onClick={() => applyCouponMutation.mutate()}
                        disabled={!couponCode.trim() || applyCouponMutation.isPending}
                        className="rounded-md bg-brand-ink px-3 py-2 text-xs font-semibold text-white"
                      >
                        {applyCouponMutation.isPending ? "Applying" : "Apply"}
                      </button>
                    </div>
                    {couponMessage ? (
                      <div className="mt-2 flex items-center justify-between gap-2 text-xs text-emerald-700">
                        <span>{couponMessage}</span>
                        <button
                          onClick={() => {
                            setCouponTotals(null);
                            setCouponMessage(null);
                            setCouponError(null);
                          }}
                          className="text-[11px] uppercase tracking-[0.2em]"
                        >
                          Clear
                        </button>
                      </div>
                    ) : null}
                    {couponError ? <p className="mt-2 text-xs text-brand-cinnabar">{couponError}</p> : null}
                  </div>

                  {displayTotals ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm text-brand-ink/70">
                        <span>Subtotal</span>
                        <span>
                          {formatCurrency(
                            displayTotals.subtotalAmountMinor,
                            displayTotals.currency
                          )}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm text-brand-ink/70">
                        <span>Tax</span>
                        <span>
                          {formatCurrency(
                            displayTotals.taxAmountMinor,
                            displayTotals.currency
                          )}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm text-brand-ink/70">
                        <span>Delivery</span>
                        <span>
                          {formatCurrency(
                            displayTotals.deliveryAmountMinor,
                            displayTotals.currency
                          )}
                        </span>
                      </div>
                      {displayTotals.discountAmountMinor ? (
                        <div className="flex items-center justify-between text-sm text-emerald-700">
                          <span>Discount</span>
                          <span>
                            -{formatCurrency(
                              displayTotals.discountAmountMinor,
                              displayTotals.currency
                            )}
                          </span>
                        </div>
                      ) : null}
                      <div className="flex items-center justify-between border-t border-brand-ink/10 pt-3 text-base font-semibold text-brand-ink">
                        <span>Total</span>
                        <span>
                          {formatCurrency(
                            displayTotals.totalAmountMinor,
                            displayTotals.currency
                          )}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-md border border-brand-ink/10 bg-brand-ink/5 px-3 py-3 text-sm text-brand-ink/70">
                      {validateMutation.isPending ? "Validating totals..." : "Totals will appear after validation."}
                    </div>
                  )}

                  {checkoutError ? (
                    <div className="rounded-md border border-brand-cinnabar/30 bg-brand-cinnabar/5 px-3 py-2 text-sm text-brand-cinnabar">
                      {checkoutError}
                    </div>
                  ) : null}

                  {fulfillmentType === "DELIVERY" && addressLoginRequired ? (
                    <div className="rounded-md border border-brand-ink/10 bg-brand-ink/5 px-3 py-2 text-xs text-brand-ink/70">
                      Delivery validation requires a signed-in account.
                    </div>
                  ) : null}

                  <button
                    onClick={handlePlaceOrder}
                    disabled={
                      checkoutMutation.isPending ||
                      validateMutation.isPending ||
                      validationErrors.length > 0 ||
                      (fulfillmentType === "DELIVERY" && (!addressId || addressLoginRequired))
                    }
                    className="w-full rounded-md bg-brand-cinnabar px-4 py-3 text-center text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-brand-cinnabar/60"
                  >
                    {checkoutMutation.isPending
                      ? "Starting payment..."
                      : validateMutation.isPending
                      ? "Validating..."
                      : "Place Order"}
                  </button>
                  <p className="text-xs text-brand-ink/50">
                    You will be redirected to the secure payment page.
                  </p>
                </div>
              </aside>
            </div>
          )}
        </Container>
      </section>
    </main>
  );
}

function CheckoutSkeleton() {
  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
      <div className="space-y-4">
        {Array.from({ length: 2 }).map((_, index) => (
          <div key={index} className="h-40 rounded-lg bg-brand-ink/10" />
        ))}
      </div>
      <div className="h-64 rounded-lg bg-brand-ink/10" />
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

function formatCurrency(amountMinor: number, currency: string) {
  const formatter = new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency
  });
  return formatter.format(amountMinor / 100);
}

function resolveCheckoutCouponTotals(
  payload: CouponApplyResponse,
  totals: CartValidationResponse["totals"]
) {
  if (payload.totals) {
    return {
      ...payload.totals,
      discountAmountMinor:
        payload.totals.discountAmountMinor ?? Math.max(payload.discountAmountMinor ?? 0, 0)
    };
  }

  if (!totals) return null;

  const discountAmountMinor = Math.max(payload.discountAmountMinor ?? 0, 0);
  return {
    ...totals,
    discountAmountMinor,
    totalAmountMinor: Math.max(totals.totalAmountMinor - discountAmountMinor, 0)
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

function generateIdempotencyKey() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `checkout_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}
