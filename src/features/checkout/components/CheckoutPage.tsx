"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Container from "@/components/layout/Container";
import SectionHero from "@/components/sections/SectionHero";
import { useCartStore } from "@/store/useCartStore";
import CheckoutAddressSection from "@/features/checkout/components/CheckoutAddressSection";
import { useUserIdentity } from "@/hooks/useUserIdentity";
import { getDictionary, t } from "@/lib/i18n";
import type {
  CartValidationResponse,
  CheckoutSessionResponse
} from "@/features/checkout/types";

const CART_ENDPOINT = "/api/cart";
const CART_VALIDATE_ENDPOINT = "/api/cart/validate";
const CHECKOUT_SESSION_ENDPOINT = "/api/checkout/session";
const COUPON_APPLY_ENDPOINT = "/api/coupons/apply";
const REQUEST_TIMEOUT_MS = 15_000;

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

type PaymentProvider = "FLUTTERWAVE" | "PAYSTACK";

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

type RequestStatus = "idle" | "loading" | "success" | "error";

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

type CheckoutPageProps = {
  locale: string;
  defaultPaymentProvider: PaymentProvider;
};

export default function CheckoutPage({ locale, defaultPaymentProvider }: CheckoutPageProps) {
  const [guestId, setGuestId] = useState<string | null>(null);
  const { userId } = useUserIdentity();
  const [fulfillmentType, setFulfillmentType] = useState<FulfillmentType>("PICKUP");
  const [paymentProvider, setPaymentProvider] = useState<PaymentProvider>(defaultPaymentProvider);
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
  const [validationState, setValidationState] = useState<RequestStatus>("idle");
  const [checkoutState, setCheckoutState] = useState<RequestStatus>("idle");
  const [couponState, setCouponState] = useState<RequestStatus>("idle");
  const { setItemCount } = useCartStore();
  const queryClient = useQueryClient();
  const mountedRef = useRef(true);
  const validationKeyRef = useRef<string | null>(null);
  const validationRequestIdRef = useRef(0);
  const validationAbortRef = useRef<AbortController | null>(null);
  const checkoutRequestIdRef = useRef(0);
  const checkoutAbortRef = useRef<AbortController | null>(null);
  const couponRequestIdRef = useRef(0);
  const couponAbortRef = useRef<AbortController | null>(null);
  const dict = getDictionary(locale);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      validationRequestIdRef.current += 1;
      checkoutRequestIdRef.current += 1;
      couponRequestIdRef.current += 1;
      validationAbortRef.current?.abort();
      checkoutAbortRef.current?.abort();
      couponAbortRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    const id = resolveGuestId();
    if (id) setGuestId(id);
  }, []);

  const cartQuery = useQuery<CartResponse>({
    queryKey: ["cart", guestId],
    enabled: Boolean(guestId),
    queryFn: async ({ signal }) =>
      fetchJsonWithTimeout<CartResponse>(`${CART_ENDPOINT}?guestId=${guestId}`, {}, { signal }),
    staleTime: 15 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false
  });

  const promotionsQuery = useQuery<PromotionsResponse>({
    queryKey: ["promotions"],
    queryFn: async ({ signal }) =>
      fetchJsonWithTimeout<PromotionsResponse>("/api/promotions/active", {}, { signal }).catch(() => ({ promotions: [] })),
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false
  });

  useEffect(() => {
    const count = cartQuery.data?.cart?.items?.reduce((sum, item) => sum + item.quantity, 0) ?? 0;
    setItemCount(count);
  }, [cartQuery.data, setItemCount]);

  const runValidation = useCallback(async () => {
    if (!guestId) return null;

    validationAbortRef.current?.abort();
    const controller = new AbortController();
    validationAbortRef.current = controller;
    const requestId = ++validationRequestIdRef.current;
    setValidationState("loading");

    try {
      const payload = await fetchJsonWithTimeout<CartValidationResponse>(CART_VALIDATE_ENDPOINT, {
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
      }, { signal: controller.signal });

      if (!mountedRef.current || requestId !== validationRequestIdRef.current) return null;
      setValidationState("success");
      setValidationErrors(payload.errors ?? []);
      setValidationTotals(payload.totals ?? null);
      return payload;
    } catch (error) {
      if (!mountedRef.current || requestId !== validationRequestIdRef.current) return null;
      if (isAbortError(error)) return null;
      setValidationState("error");
      setValidationErrors([normalizeCheckoutError(error, dict, "checkout.validationFailed")]);
      setValidationTotals(null);
      return null;
    }
  }, [addressId, dict, fulfillmentType, guestId, paymentProvider, pickupSlotId, userId]);

  const runCheckoutSession = useCallback(async () => {
    if (!guestId) return null;

    checkoutAbortRef.current?.abort();
    const controller = new AbortController();
    checkoutAbortRef.current = controller;
    const requestId = ++checkoutRequestIdRef.current;
    setCheckoutState("loading");

    try {
      const payload = await fetchJsonWithTimeout<CheckoutSessionResponse>(CHECKOUT_SESSION_ENDPOINT, {
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
      }, { signal: controller.signal });

      if (!mountedRef.current || requestId !== checkoutRequestIdRef.current) return null;
      setCheckoutState("success");
      return payload;
    } catch (error) {
      if (!mountedRef.current || requestId !== checkoutRequestIdRef.current) return null;
      if (isAbortError(error)) return null;
      setCheckoutState("error");
      throw new Error(normalizeCheckoutError(error, dict, "checkout.failedToStart"));
    }
  }, [addressId, dict, fulfillmentType, guestId, paymentProvider, pickupSlotId, userId]);

  const runCouponRequest = useCallback(async () => {
    if (!guestId) return null;

    couponAbortRef.current?.abort();
    const controller = new AbortController();
    couponAbortRef.current = controller;
    const requestId = ++couponRequestIdRef.current;
    setCouponState("loading");

    try {
      const payload = await fetchJsonWithTimeout<CouponApplyResponse>(COUPON_APPLY_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guestId, userId: userId || undefined, code: couponCode.trim() })
      }, { signal: controller.signal });

      if (!mountedRef.current || requestId !== couponRequestIdRef.current) return null;
      setCouponState("success");
      const totals = resolveCheckoutCouponTotals(payload, validationTotals);
      setCouponTotals(totals);
      setCouponMessage(payload.message || t(dict, "checkout.couponApplied"));
      setCouponError(null);
      return payload;
    } catch (error) {
      if (!mountedRef.current || requestId !== couponRequestIdRef.current) return null;
      if (isAbortError(error)) return null;
      setCouponState("error");
      setCouponError(normalizeCheckoutError(error, dict, "checkout.couponFailed"));
      setCouponMessage(null);
      setCouponTotals(null);
      return null;
    }
  }, [couponCode, dict, guestId, userId, validationTotals]);

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

    const validationKey = [
      guestId,
      userId || "",
      fulfillmentType,
      paymentProvider,
      addressId || "",
      pickupSlotId || "",
      cart.id,
      cart.totalAmountMinor
    ].join("|");

    if (validationKeyRef.current === validationKey) {
      return;
    }

    validationKeyRef.current = validationKey;
    setValidationErrors([]);
    setValidationTotals(null);
    void runValidation();
  }, [cart, guestId, userId, fulfillmentType, paymentProvider, addressId, pickupSlotId, runValidation]);

  useEffect(() => {
    couponAbortRef.current?.abort();
    couponRequestIdRef.current += 1;
    setCouponTotals(null);
    setCouponMessage(null);
    setCouponError(null);
  }, [fulfillmentType, paymentProvider, addressId, pickupSlotId]);

  async function handlePlaceOrder() {
    setCheckoutError(null);

    if (fulfillmentType === "DELIVERY" && addressLoginRequired) {
      setCheckoutError(t(dict, "checkout.signInDelivery"));
      return;
    }

    if (fulfillmentType === "DELIVERY" && !addressId) {
      setCheckoutError(t(dict, "checkout.selectDeliveryAddress"));
      return;
    }

    const validationPayload = await runValidation();
    if (!validationPayload || !validationPayload.valid) {
      setCheckoutError(t(dict, "checkout.resolveValidation"));
      return;
    }

    const sessionResult = await runCheckoutSession().catch((error) => {
      if (mountedRef.current) {
        setCheckoutError(error instanceof Error ? error.message : t(dict, "checkout.failedToStart"));
      }
      return null;
    });

    if (!sessionResult?.checkoutUrl) {
      setCheckoutError(t(dict, "checkout.paymentSessionUnavailable"));
      return;
    }

    setItemCount(0);
    queryClient.invalidateQueries({ queryKey: ["cart", guestId] });
    window.location.href = sessionResult.checkoutUrl;
  }

  return (
    <main className="bg-brand-obsidian text-brand-ink lux-gradient page-transition">
      <Container className="py-16 lg:py-20">
        <SectionHero
          eyebrow={t(dict, "checkout.title")}
          title={t(dict, "checkout.completeOrder")}
          subtitle={t(dict, "checkout.confirmDetails")}
        >
          <ol className="flex flex-wrap gap-3">
            {[
              { step: "01", label: t(dict, "checkout.stepDelivery") },
              { step: "02", label: t(dict, "checkout.stepPayment") },
              { step: "03", label: t(dict, "checkout.stepReview") }
            ].map((item) => (
              <li
                key={item.step}
                className="flex items-center gap-3 rounded-full border border-brand-gold/20 bg-black/40 px-4 py-2 text-xs uppercase tracking-[0.3em] text-brand-gold"
              >
                <span className="text-[10px] text-brand-gold/70">{item.step}</span>
                <span className="text-brand-ink/70">{item.label}</span>
              </li>
            ))}
          </ol>
        </SectionHero>
      </Container>

      <section className="border-t border-brand-gold/10">
        <Container className="py-10">
          {cartQuery.isLoading ? (
            <CheckoutSkeleton />
          ) : cartQuery.isError ? (
            <div className="rounded-2xl border border-brand-gold/10 bg-white/5 p-6 text-sm text-brand-ink/70 shadow-soft">
              {t(dict, "checkout.unableToLoad")}
            </div>
          ) : empty ? (
            <EmptyState />
          ) : (
            <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
              <div className="space-y-6">
                <div className="rounded-2xl border border-brand-gold/10 bg-white/5 p-6 shadow-soft">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-brand-ink">{t(dict, "checkout.step01Heading")}</h2>
                    <span className="text-xs uppercase tracking-[0.3em] text-brand-gold/70">
                      {t(dict, "checkout.fulfillment")}
                    </span>
                  </div>
                  <fieldset className="mt-4 grid gap-4 sm:grid-cols-2" aria-describedby="checkout-fulfillment-help">
                    <legend id="checkout-fulfillment-help" className="sr-only">
                      {t(dict, "checkout.fulfillment")}
                    </legend>
                    <label
                      className={`flex items-center gap-3 rounded-xl border px-4 py-3 transition focus-within:ring-2 focus-within:ring-brand-gold/40 ${
                        fulfillmentType === "PICKUP"
                          ? "border-brand-gold/50 bg-brand-gold/10"
                          : "border-brand-gold/10 bg-black/40"
                      }`}
                    >
                      <input
                        type="radio"
                        name="fulfillmentType"
                        value="PICKUP"
                        checked={fulfillmentType === "PICKUP"}
                        onChange={() => setFulfillmentType("PICKUP")}
                        className="h-4 w-4 accent-brand-gold"
                      />
                      <div>
                        <p className="text-sm font-semibold text-brand-ink">{t(dict, "checkout.pickup")}</p>
                        <p className="text-xs text-brand-ink/60">{t(dict, "checkout.collectFromRestaurant")}</p>
                      </div>
                    </label>
                    <label
                      className={`flex items-center gap-3 rounded-xl border px-4 py-3 transition focus-within:ring-2 focus-within:ring-brand-gold/40 ${
                        fulfillmentType === "DELIVERY"
                          ? "border-brand-gold/50 bg-brand-gold/10"
                          : "border-brand-gold/10 bg-black/40"
                      }`}
                    >
                      <input
                        type="radio"
                        name="fulfillmentType"
                        value="DELIVERY"
                        checked={fulfillmentType === "DELIVERY"}
                        onChange={() => setFulfillmentType("DELIVERY")}
                        className="h-4 w-4 accent-brand-gold"
                      />
                      <div>
                        <p className="text-sm font-semibold text-brand-ink">{t(dict, "checkout.delivery")}</p>
                        <p className="text-xs text-brand-ink/60">{t(dict, "checkout.bringToYou")}</p>
                      </div>
                    </label>
                  </fieldset>

                  {fulfillmentType === "DELIVERY" ? (
                    <div className="mt-4">
                      <CheckoutAddressSection
                        locale={locale}
                        onSelectAddress={(nextId, requiresLogin) => {
                          setAddressId(nextId);
                          setAddressLoginRequired(requiresLogin);
                        }}
                      />
                    </div>
                  ) : (
                    <div className="mt-4 grid gap-3">
                      <label htmlFor="pickup-slot" className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-gold/70">
                        {t(dict, "checkout.pickupSlot")}
                      </label>
                      <input
                        id="pickup-slot"
                        name="pickupSlot"
                        value={pickupSlotId}
                        onChange={(event) => setPickupSlotId(event.target.value)}
                        placeholder={t(dict, "checkout.pickupSlotPlaceholder")}
                        className="rounded-xl border border-brand-gold/10 bg-black/40 px-3 py-2 text-sm text-brand-ink transition focus:outline-none focus:ring-2 focus:ring-brand-gold/40 focus-visible:ring-2 focus-visible:ring-brand-gold/60"
                      />
                    </div>
                  )}
                </div>

                <div className="rounded-2xl border border-brand-gold/10 bg-white/5 p-6 shadow-soft">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-brand-ink">{t(dict, "checkout.step02Heading")}</h2>
                    <span className="text-xs uppercase tracking-[0.3em] text-brand-gold/70">
                      {t(dict, "checkout.provider")}
                    </span>
                  </div>
                  <div className="mt-4 grid gap-3">
                    <label htmlFor="payment-provider" className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-gold/70">
                      {t(dict, "checkout.provider")}
                    </label>
                    <select
                      id="payment-provider"
                      name="paymentProvider"
                      value={paymentProvider}
                      onChange={(event) => setPaymentProvider(event.target.value as PaymentProvider)}
                      className="rounded-xl border border-brand-gold/10 bg-black/40 px-3 py-2 text-sm text-brand-ink transition focus:outline-none focus:ring-2 focus:ring-brand-gold/40 focus-visible:ring-2 focus-visible:ring-brand-gold/60"
                    >
                      <option value="FLUTTERWAVE">Flutterwave</option>
                      <option value="PAYSTACK">Paystack ({t(dict, "checkout.comingSoon")})</option>
                    </select>
                  </div>
                </div>
              </div>

              <aside aria-busy={validationState === "loading" || checkoutState === "loading"}>
                <div className="sticky top-24 space-y-4 rounded-2xl border border-brand-gold/10 bg-white/5 p-6 shadow-crisp">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-brand-ink">{t(dict, "checkout.step03Heading")}</h2>
                    <span className="text-xs text-brand-ink/60">{t(dict, "checkout.itemsCount").replace("{count}", String(itemsCount))}</span>
                  </div>

                    {validationState === "loading" ? (
                    <div className="rounded-xl border border-brand-gold/10 bg-black/40 px-3 py-2 text-xs text-brand-ink/70" role="status" aria-live="polite" aria-atomic="true">
                      {t(dict, "checkout.updatingTotals")}
                    </div>
                  ) : null}

                  {validationErrors.length > 0 ? (
                    <div className="rounded-xl border border-brand-gold/20 bg-brand-gold/10 px-3 py-2 text-sm text-brand-ink" role="alert" aria-live="polite">
                      <p className="font-semibold">{t(dict, "checkout.attentionTitle")}</p>
                      <ul className="mt-2 list-disc space-y-1 pl-4 text-xs">
                        {validationErrors.map((error) => (
                          <li key={error}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  {activePromotions.length > 0 ? (
                    <div className="rounded-xl border border-brand-gold/10 bg-black/40 px-3 py-2 text-xs text-brand-ink/70">
                      <p className="text-[11px] uppercase tracking-[0.2em] text-brand-gold/60">
                        {t(dict, "cart.activePromotions")}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {activePromotions.map((promo) => (
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
                    <label htmlFor="coupon-code" className="text-xs uppercase tracking-[0.2em] text-brand-gold/60">{t(dict, "cart.coupon")}</label>
                    <div className="mt-2 flex gap-2">
                      <input
                        id="coupon-code"
                        name="couponCode"
                        value={couponCode}
                        onChange={(event) => setCouponCode(event.target.value)}
                        placeholder={t(dict, "cart.couponPlaceholder")}
                        className="w-full rounded-lg border border-brand-gold/10 bg-black/40 px-3 py-2 text-sm text-brand-ink transition focus:outline-none focus:ring-2 focus:ring-brand-gold/40 focus-visible:ring-2 focus-visible:ring-brand-gold/60"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          void runCouponRequest();
                        }}
                        disabled={!couponCode.trim() || couponState === "loading"}
                        className="rounded-lg bg-brand-gold px-3 py-2 text-xs font-semibold text-black transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold/60 disabled:cursor-not-allowed disabled:bg-brand-gold/40"
                      >
                        {couponState === "loading" ? t(dict, "cart.applying") : t(dict, "cart.apply")}
                      </button>
                    </div>
                    {couponMessage ? (
                      <div className="mt-2 flex items-center justify-between gap-2 text-xs text-emerald-700" role="status" aria-live="polite">
                        <span>{couponMessage}</span>
                        <button
                          type="button"
                          onClick={() => {
                            setCouponTotals(null);
                            setCouponMessage(null);
                            setCouponError(null);
                          }}
                          className="text-[11px] uppercase tracking-[0.2em] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold/60"
                        >
                          {t(dict, "cart.clear")}
                        </button>
                      </div>
                    ) : null}
                    {couponError ? <p className="mt-2 text-xs text-brand-cinnabar" role="alert">{couponError}</p> : null}
                  </div>

                  {displayTotals ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm text-brand-ink/70">
                        <span>{t(dict, "cart.subtotal")}</span>
                        <span>{formatCurrency(displayTotals.subtotalAmountMinor, displayTotals.currency)}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm text-brand-ink/70">
                        <span>{t(dict, "checkout.tax")}</span>
                        <span>{formatCurrency(displayTotals.taxAmountMinor, displayTotals.currency)}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm text-brand-ink/70">
                        <span>{t(dict, "checkout.delivery")}</span>
                        <span>{formatCurrency(displayTotals.deliveryAmountMinor, displayTotals.currency)}</span>
                      </div>
                      {displayTotals.discountAmountMinor ? (
                        <div className="flex items-center justify-between text-sm text-emerald-700">
                          <span>{t(dict, "cart.discount")}</span>
                          <span>-{formatCurrency(displayTotals.discountAmountMinor, displayTotals.currency)}</span>
                        </div>
                      ) : null}
                      <div className="flex items-center justify-between border-t border-brand-gold/10 pt-3 text-base font-semibold text-brand-ink">
                        <span>{t(dict, "cart.total")}</span>
                        <span>{formatCurrency(displayTotals.totalAmountMinor, displayTotals.currency)}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-brand-gold/10 bg-black/40 px-3 py-3 text-sm text-brand-ink/70">
                      {validationState === "loading" ? t(dict, "checkout.validatingTotals") : t(dict, "checkout.totalsAfterValidation")}
                    </div>
                  )}

                  {checkoutError ? (
                    <div className="rounded-xl border border-brand-cinnabar/30 bg-brand-cinnabar/10 px-3 py-2 text-sm text-brand-cinnabar" role="alert">
                      {checkoutError}
                    </div>
                  ) : null}

                  {fulfillmentType === "DELIVERY" && addressLoginRequired ? (
                    <div className="rounded-xl border border-brand-gold/10 bg-black/40 px-3 py-2 text-xs text-brand-ink/70">
                      {t(dict, "checkout.deliveryRequiresLogin")}
                    </div>
                  ) : null}

                  <button
                    type="button"
                    onClick={handlePlaceOrder}
                    disabled={
                      checkoutState === "loading" ||
                      validationState === "loading" ||
                      validationErrors.length > 0 ||
                      (fulfillmentType === "DELIVERY" && (!addressId || addressLoginRequired))
                    }
                    className="w-full rounded-full bg-brand-gold px-4 py-3 text-center text-sm font-semibold text-black transition hover:shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold/60 disabled:cursor-not-allowed disabled:bg-brand-gold/40"
                  >
                    {checkoutState === "loading"
                      ? t(dict, "checkout.startingPayment")
                      : validationState === "loading"
                      ? t(dict, "checkout.validating")
                      : t(dict, "checkout.placeOrder")}
                  </button>
                  <p className="text-xs text-brand-ink/50">
                    {t(dict, "checkout.redirectNotice")}
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
    <div className="grid gap-8 lg:grid-cols-[1fr_340px]" role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only">Loading checkout details</span>
      <div className="space-y-4">
        {Array.from({ length: 2 }).map((_, index) => (
          <div key={index} className="h-28 rounded-2xl bg-brand-ink/10 skeleton" aria-hidden="true" />
        ))}
      </div>
      <div className="hidden lg:block">
        <div className="h-48 rounded-2xl bg-brand-ink/10 skeleton" aria-hidden="true" />
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-brand-gold/10 bg-white/5 p-6 text-center text-sm text-brand-ink/70 shadow-soft">
      <p className="text-base font-semibold text-brand-ink">{t(getDictionary(resolveLocale()), "cart.empty")}</p>
      <p className="mt-2">{t(getDictionary(resolveLocale()), "cart.emptyMessage")}</p>
      <Link
        href={`/${resolveLocale()}/${resolveCountry()}/menu`}
        className="btn btn-gold mt-4 inline-flex"
      >
        {t(getDictionary(resolveLocale()), "common.explore")}
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

async function fetchJsonWithTimeout<T>(
  url: string,
  init: RequestInit = {},
  options: { signal?: AbortSignal; timeoutMs?: number } = {}
): Promise<T> {
  const controller = new AbortController();
  const timeoutMs = options.timeoutMs ?? REQUEST_TIMEOUT_MS;
  let timedOut = false;
  const timeoutId = window.setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);
  const forwardAbort = () => controller.abort();

  if (options.signal) {
    if (options.signal.aborted) {
      throw createAbortError();
    }
    options.signal.addEventListener("abort", forwardAbort);
  }

  try {
    const response = await fetch(url, {
      ...init,
      signal: controller.signal
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload.error || payload.message || payload.detail || "Failed to fetch");
    }

    return payload as T;
  } catch (error) {
    if (timedOut && !options.signal?.aborted) {
      throw new RequestTimeoutError();
    }
    if (controller.signal.aborted || isAbortError(error)) {
      throw createAbortError();
    }
    throw error;
  } finally {
    if (options.signal) {
      options.signal.removeEventListener("abort", forwardAbort);
    }
    window.clearTimeout(timeoutId);
  }
}

function createAbortError() {
  return new DOMException("The operation was aborted.", "AbortError");
}

class RequestTimeoutError extends Error {
  constructor() {
    super("Request timed out");
    this.name = "TimeoutError";
  }
}

function isAbortError(error: unknown) {
  return (error instanceof DOMException && error.name === "AbortError") || (error instanceof Error && error.name === "AbortError");
}

function isTimeoutError(error: unknown) {
  return error instanceof Error && error.name === "TimeoutError";
}

function normalizeCheckoutError(error: unknown, dict: ReturnType<typeof getDictionary>, fallbackKey: string) {
  if (typeof error === "string" && error.trim()) return error;
  if (isTimeoutError(error)) return t(dict, "checkout.requestTimedOut");
  if (isAbortError(error)) return t(dict, "checkout.requestAborted");
  if (error instanceof Error) {
    const message = error.message.trim();
    if (!message || message === "Failed to fetch") return t(dict, "checkout.networkError");
    if (message === "Request timed out") return t(dict, "checkout.requestTimedOut");
    return message;
  }
  return t(dict, fallbackKey);
}
