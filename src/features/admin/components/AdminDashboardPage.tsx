"use client";

import { useEffect, useMemo, useState } from "react";
import { io } from "socket.io-client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { UseMutationResult } from "@tanstack/react-query";
import Container from "@/components/layout/Container";
import { getDictionary, t, type DictionaryType } from "@/lib/i18n";

const ADMIN_ORDERS_ENDPOINT = "/api/admin/orders";
const ADMIN_METRICS_ENDPOINT = "/api/admin/metrics";
const ADMIN_MENU_ENDPOINT = "/api/admin/menu";
const MENU_CATEGORIES_ENDPOINT = "/api/menu/categories";
const MENU_ITEM_ENDPOINT = "/api/admin/menu/item";

type AdminOrderItem = {
  id: string;
  quantity: number;
  unitAmountMinor: number;
  currency: string;
  menuItem?: { title?: string | null } | null;
};

type AdminOrder = {
  id: string;
  status: string;
  orderType: string;
  paymentStatus: string;
  displayCurrency: string;
  subtotalAmountMinor: number;
  taxAmountMinor: number;
  deliveryFeeAmountMinor: number;
  totalAmountMinor: number;
  createdAt: string;
  user?: { name?: string | null; email?: string | null } | null;
  items: AdminOrderItem[];
};

type OrdersResponse = {
  orders: AdminOrder[];
};

type OrderStatusMutation = UseMutationResult<
  unknown,
  Error,
  { orderId: string; action: string },
  unknown
>;

type MetricsResponse = {
  todayOrderCount: number;
  todayRevenueMinor: number;
  currency: string;
};

type MenuItem = {
  id: string;
  name: string;
  description?: string | null;
  priceMinor: number;
  currency: string;
  imageUrl?: string | null;
  isAvailable: boolean;
  preparationTime?: number | null;
};

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

type CategoryListResponse = {
  categories: Array<{ id: string; name: string }>;
};

type MenuFormState = {
  name: string;
  description: string;
  price: string;
  currency: string;
  imageUrl: string;
  categoryId: string;
  preparationTime: string;
  isAvailable: boolean;
};

const EMPTY_FORM: MenuFormState = {
  name: "",
  description: "",
  price: "",
  currency: "NGN",
  imageUrl: "",
  categoryId: "",
  preparationTime: "",
  isAvailable: true
};

export default function AdminDashboardPage({ locale }: { locale: string }) {
  const dict = getDictionary(locale);
  const queryClient = useQueryClient();
  const [socketStatus, setSocketStatus] = useState("connecting");
  const [createForm, setCreateForm] = useState<MenuFormState>(EMPTY_FORM);
  const [editItemId, setEditItemId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<MenuFormState>(EMPTY_FORM);
  const [menuMessage, setMenuMessage] = useState<string | null>(null);
  const [menuError, setMenuError] = useState<string | null>(null);

  const ordersQuery = useQuery<OrdersResponse>({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const response = await fetch(ADMIN_ORDERS_ENDPOINT, { cache: "no-store" });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || t(dict, "admin.dashboard.ordersError"));
      }
      return response.json();
    },
    staleTime: 5 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false
  });

  const metricsQuery = useQuery<MetricsResponse>({
    queryKey: ["admin-metrics"],
    queryFn: async () => {
      const response = await fetch(ADMIN_METRICS_ENDPOINT, { cache: "no-store" });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || t(dict, "admin.dashboard.metricsError"));
      }
      return response.json();
    },
    staleTime: 10 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false
  });

  const menuQuery = useQuery<MenuResponse>({
    queryKey: ["admin-menu"],
    queryFn: async () => {
      const response = await fetch(ADMIN_MENU_ENDPOINT, { cache: "no-store" });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || t(dict, "admin.dashboard.menuError"));
      }
      return response.json();
    },
    staleTime: 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false
  });

  const categoriesQuery = useQuery<CategoryListResponse>({
    queryKey: ["menu-categories"],
    queryFn: async () => {
      const response = await fetch(MENU_CATEGORIES_ENDPOINT, { cache: "no-store" });
      if (!response.ok) return { categories: [] };
      return response.json();
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false
  });

  useEffect(() => {
    const socket = io({
      path: "/api/realtime/connect",
      transports: ["websocket"],
      autoConnect: true,
      withCredentials: true
    });

    socket.on("connect", () => {
      setSocketStatus("connected");
      socket.emit("subscribe", "kitchen:orders");
      socket.emit("subscribe", "delivery:orders");
    });

    socket.on("disconnect", () => {
      setSocketStatus("disconnected");
    });

    socket.on("connect_error", () => {
      setSocketStatus("error");
    });

    socket.on("subscription.error", () => {
      setSocketStatus("error");
    });

    const events = [
      "order.accepted",
      "order.preparing",
      "order.ready",
      "order.out_for_delivery",
      "order.delivered",
      "order.cancelled",
      "payment.confirmed",
      "payment.failed"
    ];

    events.forEach((event) => {
      socket.on(event, () => {
        queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
        queryClient.invalidateQueries({ queryKey: ["admin-metrics"] });
      });
    });

    return () => {
      events.forEach((event) => socket.off(event));
      socket.emit("unsubscribe", "kitchen:orders");
      socket.emit("unsubscribe", "delivery:orders");
      socket.disconnect();
    };
  }, [queryClient]);

  const statusMutation = useMutation<unknown, Error, { orderId: string; action: string }>({
    mutationFn: async (payload: { orderId: string; action: string }) => {
      const response = await fetch(`/api/orders/${payload.orderId}/${payload.action}`,
        { method: "POST" }
      );

      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(body.error || t(dict, "admin.dashboard.updateError"));
      }
      return body;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      queryClient.invalidateQueries({ queryKey: ["admin-metrics"] });
    }
  });

  const createMutation = useMutation({
    mutationFn: async (payload: MenuFormState) => {
      const response = await fetch(MENU_ITEM_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: payload.name,
          description: payload.description || undefined,
          price: Number(payload.price),
          currency: payload.currency,
          imageUrl: payload.imageUrl || undefined,
          categoryId: payload.categoryId,
          isAvailable: payload.isAvailable,
          preparationTime: payload.preparationTime ? Number(payload.preparationTime) : undefined
        })
      });

      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(body.error || t(dict, "admin.dashboard.createError"));
      }
      return body;
    },
    onSuccess: () => {
      setCreateForm(EMPTY_FORM);
      setMenuMessage(t(dict, "admin.dashboard.menuCreated"));
      setMenuError(null);
      queryClient.invalidateQueries({ queryKey: ["admin-menu"] });
    },
    onError: (error) => {
      setMenuError(error instanceof Error ? error.message : t(dict, "admin.dashboard.createError"));
      setMenuMessage(null);
    }
  });

  const updateMutation = useMutation({
    mutationFn: async (payload: { id: string; form: MenuFormState }) => {
      const response = await fetch(`${MENU_ITEM_ENDPOINT}/${payload.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: payload.form.name,
          description: payload.form.description || undefined,
          price: payload.form.price ? Number(payload.form.price) : undefined,
          currency: payload.form.currency,
          imageUrl: payload.form.imageUrl || undefined,
          categoryId: payload.form.categoryId || undefined,
          isAvailable: payload.form.isAvailable,
          preparationTime: payload.form.preparationTime
            ? Number(payload.form.preparationTime)
            : undefined
        })
      });

      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(body.error || t(dict, "admin.dashboard.updateError"));
      }
      return body;
    },
    onSuccess: () => {
      setEditItemId(null);
      setMenuMessage(t(dict, "admin.dashboard.menuUpdated"));
      setMenuError(null);
      queryClient.invalidateQueries({ queryKey: ["admin-menu"] });
    },
    onError: (error) => {
      setMenuError(error instanceof Error ? error.message : t(dict, "admin.dashboard.updateError"));
      setMenuMessage(null);
    }
  });

  const categories = menuQuery.data?.categories ?? [];
  const orders = useMemo(
    () => ordersQuery.data?.orders ?? [],
    [ordersQuery.data?.orders]
  );
  const metrics = metricsQuery.data;
  const liveOrders = orders;

  function handleEdit(item: MenuItem) {
    setEditItemId(item.id);
    setEditForm({
      name: item.name,
      description: item.description ?? "",
      price: String(item.priceMinor / 100),
      currency: item.currency,
      imageUrl: item.imageUrl ?? "",
      categoryId: findCategoryId(item.id, categories) ?? "",
      preparationTime: item.preparationTime ? String(item.preparationTime) : "",
      isAvailable: item.isAvailable
    });
  }

  function handleAvailabilityToggle(item: MenuItem) {
    updateMutation.mutate({
      id: item.id,
      form: {
        ...editForm,
        name: item.name,
        description: item.description ?? "",
        price: String(item.priceMinor / 100),
        currency: item.currency,
        imageUrl: item.imageUrl ?? "",
        categoryId: findCategoryId(item.id, categories) ?? "",
        preparationTime: item.preparationTime ? String(item.preparationTime) : "",
        isAvailable: !item.isAvailable
      }
    });
  }

  return (
    <main className="bg-brand-rice">
      <Container className="py-10">
        <div className="flex flex-col gap-4">
          <p className="text-xs uppercase tracking-[0.3em] text-brand-ink/60">{t(dict, "admin.dashboard.eyebrow")}</p>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="font-display text-3xl text-brand-ink sm:text-4xl">{t(dict, "admin.dashboard.title")}</h1>
              <p className="mt-2 text-sm text-brand-ink/70">{t(dict, "admin.dashboard.subtitle")}</p>
            </div>
            <div className="rounded-full border border-brand-ink/10 bg-white px-3 py-1 text-xs text-brand-ink/60">
              {t(dict, "admin.dashboard.liveUpdates")}: {t(dict, `admin.dashboard.${socketStatus}`)}
            </div>
          </div>
        </div>
      </Container>

      <section className="border-t border-brand-ink/10">
        <Container className="py-8">
          <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-6">
              <div className="rounded-lg border border-brand-ink/10 bg-white p-5 shadow-soft">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-brand-ink">{t(dict, "admin.dashboard.liveOrders")}</h2>
                  <span className="text-xs text-brand-ink/60">{liveOrders.length} {t(dict, "admin.dashboard.active")}</span>
                </div>
                {ordersQuery.isLoading ? (
                  <p className="mt-4 text-sm text-brand-ink/60">{t(dict, "admin.dashboard.loadingOrders")}</p>
                ) : ordersQuery.isError ? (
                  <p className="mt-4 text-sm text-brand-cinnabar">{t(dict, "admin.dashboard.ordersError")}</p>
                ) : liveOrders.length === 0 ? (
                  <p className="mt-4 text-sm text-brand-ink/60">{t(dict, "admin.dashboard.noActiveOrders")}</p>
                ) : (
                  <div className="mt-4 space-y-4">
                    {liveOrders.map((order) => (
                      <div key={order.id} className="rounded-md border border-brand-ink/10 p-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-brand-ink">{t(dict, "admin.dashboard.orderPrefix")} {order.id}</p>
                            <p className="text-xs text-brand-ink/60">
                              {order.user?.name || order.user?.email || t(dict, "admin.dashboard.guestFallback")} ·
                              {` ${formatDateTime(order.createdAt)}`}
                            </p>
                          </div>
                          <span className="rounded-full bg-brand-ink/10 px-3 py-1 text-xs text-brand-ink/70">
                            {order.status}
                          </span>
                        </div>
                        <div className="mt-3 text-xs text-brand-ink/60">
                          {order.items.map((item) => (
                            <div key={item.id} className="flex items-center justify-between">
                                <span>
                                {item.quantity}x {item.menuItem?.title || t(dict, "admin.dashboard.itemFallback")}
                              </span>
                              <span>
                                {formatCurrency(
                                  item.unitAmountMinor * item.quantity,
                                  item.currency
                                )}
                              </span>
                            </div>
                          ))}
                        </div>
                        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                          <span className="text-sm font-semibold text-brand-ink">
                            {formatCurrency(order.totalAmountMinor, order.displayCurrency)}
                          </span>
                          <div className="flex flex-wrap gap-2">
                            {renderOrderActions(order, statusMutation, dict)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-lg border border-brand-ink/10 bg-white p-5 shadow-soft">
                <h2 className="text-lg font-semibold text-brand-ink">{t(dict, "admin.dashboard.today")}</h2>
                {metricsQuery.isLoading ? (
                  <p className="mt-4 text-sm text-brand-ink/60">{t(dict, "admin.dashboard.loadingMetrics")}</p>
                ) : metricsQuery.isError ? (
                  <p className="mt-4 text-sm text-brand-cinnabar">{t(dict, "admin.dashboard.metricsError")}</p>
                ) : metrics ? (
                  <div className="mt-4 grid gap-4">
                    <div className="rounded-md border border-brand-ink/10 bg-brand-rice px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.2em] text-brand-ink/50">{t(dict, "admin.dashboard.orders")}</p>
                      <p className="mt-2 text-2xl font-semibold text-brand-ink">
                        {metrics.todayOrderCount}
                      </p>
                    </div>
                    <div className="rounded-md border border-brand-ink/10 bg-brand-rice px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.2em] text-brand-ink/50">{t(dict, "admin.dashboard.revenue")}</p>
                      <p className="mt-2 text-2xl font-semibold text-brand-ink">
                        {formatCurrency(metrics.todayRevenueMinor, metrics.currency)}
                      </p>
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="rounded-lg border border-brand-ink/10 bg-white p-5 shadow-soft">
                <h2 className="text-lg font-semibold text-brand-ink">{t(dict, "admin.dashboard.menuManagement")}</h2>
                <div className="mt-4 space-y-4">
                  <div className="rounded-md border border-brand-ink/10 bg-brand-rice p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-ink/60">{t(dict, "admin.dashboard.createItem")}</p>
                    <div className="mt-3 grid gap-3">
                      <input
                        value={createForm.name}
                        onChange={(event) =>
                          setCreateForm((prev) => ({ ...prev, name: event.target.value }))
                        }
                        placeholder={t(dict, "admin.dashboard.itemNamePlaceholder")}
                        className="w-full rounded-md border border-brand-ink/10 px-3 py-2 text-sm"
                      />
                      <textarea
                        value={createForm.description}
                        onChange={(event) =>
                          setCreateForm((prev) => ({ ...prev, description: event.target.value }))
                        }
                        placeholder={t(dict, "admin.dashboard.descriptionPlaceholder")}
                        rows={2}
                        className="w-full rounded-md border border-brand-ink/10 px-3 py-2 text-sm"
                      />
                      <div className="grid gap-3 sm:grid-cols-2">
                        <input
                          value={createForm.price}
                          onChange={(event) =>
                            setCreateForm((prev) => ({ ...prev, price: event.target.value }))
                          }
                          placeholder={t(dict, "admin.dashboard.pricePlaceholder")}
                          className="w-full rounded-md border border-brand-ink/10 px-3 py-2 text-sm"
                        />
                        <input
                          value={createForm.currency}
                          onChange={(event) =>
                            setCreateForm((prev) => ({ ...prev, currency: event.target.value }))
                          }
                          placeholder={t(dict, "admin.dashboard.currencyPlaceholder")}
                          className="w-full rounded-md border border-brand-ink/10 px-3 py-2 text-sm"
                        />
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <input
                          value={createForm.preparationTime}
                          onChange={(event) =>
                            setCreateForm((prev) => ({ ...prev, preparationTime: event.target.value }))
                          }
                          placeholder={t(dict, "admin.dashboard.prepTimePlaceholder")}
                          className="w-full rounded-md border border-brand-ink/10 px-3 py-2 text-sm"
                        />
                        <select
                          value={createForm.categoryId}
                          onChange={(event) =>
                            setCreateForm((prev) => ({ ...prev, categoryId: event.target.value }))
                          }
                          className="w-full rounded-md border border-brand-ink/10 px-3 py-2 text-sm"
                        >
                          <option value="">{t(dict, "admin.dashboard.categoryPlaceholder")}</option>
                          {categoriesQuery.data?.categories.map((category) => (
                            <option key={category.id} value={category.id}>
                              {category.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <input
                        value={createForm.imageUrl}
                        onChange={(event) =>
                          setCreateForm((prev) => ({ ...prev, imageUrl: event.target.value }))
                        }
                        placeholder={t(dict, "admin.dashboard.imageUrlPlaceholder")}
                        className="w-full rounded-md border border-brand-ink/10 px-3 py-2 text-sm"
                      />
                      <label className="flex items-center gap-2 text-xs text-brand-ink/70">
                        <input
                          type="checkbox"
                          checked={createForm.isAvailable}
                          onChange={(event) =>
                            setCreateForm((prev) => ({ ...prev, isAvailable: event.target.checked }))
                          }
                        />
                        {t(dict, "admin.dashboard.available")}
                      </label>
                      <button
                        onClick={() => createMutation.mutate(createForm)}
                        disabled={
                          !createForm.name ||
                          !createForm.price ||
                          !createForm.categoryId ||
                          createMutation.isPending
                        }
                        className="rounded-md bg-brand-ink px-4 py-2 text-xs font-semibold text-white disabled:bg-brand-ink/30"
                      >
                        {createMutation.isPending ? t(dict, "admin.dashboard.creating") : t(dict, "admin.dashboard.create")}
                      </button>
                      {menuMessage ? (
                        <p className="text-xs text-emerald-700">{menuMessage}</p>
                      ) : null}
                      {menuError ? (
                        <p className="text-xs text-brand-cinnabar">{menuError}</p>
                      ) : null}
                    </div>
                  </div>

                  <div className="space-y-4">
                      {menuQuery.isLoading ? (
                      <p className="text-sm text-brand-ink/60">{t(dict, "admin.dashboard.loadingMenu")}</p>
                    ) : menuQuery.isError ? (
                      <p className="text-sm text-brand-cinnabar">{t(dict, "admin.dashboard.menuError")}</p>
                    ) : (
                      categories.map((category) => (
                        <div key={category.id} className="rounded-md border border-brand-ink/10 p-4">
                          <div className="flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-brand-ink">
                              {category.name}
                            </h3>
                            <span className="text-xs text-brand-ink/50">{category.items.length} {t(dict, "admin.dashboard.itemsSuffix")}</span>
                          </div>
                          <div className="mt-3 space-y-3">
                            {category.items.map((item) => (
                              <div
                                key={item.id}
                                className="rounded-md border border-brand-ink/10 px-3 py-3"
                              >
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                  <div>
                                    <p className="text-sm font-semibold text-brand-ink">
                                      {item.name}
                                    </p>
                                    <p className="text-xs text-brand-ink/60">
                                      {formatCurrency(item.priceMinor, item.currency)}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={() => handleAvailabilityToggle(item)}
                                      className="rounded-full border border-brand-ink/10 px-3 py-1 text-xs text-brand-ink/70"
                                    >
                                      {item.isAvailable ? t(dict, "admin.dashboard.disable") : t(dict, "admin.dashboard.enable")}
                                    </button>
                                    <button
                                      onClick={() => handleEdit(item)}
                                      className="rounded-full border border-brand-ink/10 px-3 py-1 text-xs text-brand-ink/70"
                                    >
                                      {t(dict, "admin.dashboard.edit")}
                                    </button>
                                  </div>
                                </div>

                                {editItemId === item.id ? (
                                  <div className="mt-3 grid gap-3 rounded-md border border-brand-ink/10 bg-brand-rice p-3">
                                    <input
                                      value={editForm.name}
                                      onChange={(event) =>
                                        setEditForm((prev) => ({
                                          ...prev,
                                          name: event.target.value
                                        }))
                                      }
                                      placeholder={t(dict, "admin.dashboard.itemNamePlaceholder")}
                                      className="w-full rounded-md border border-brand-ink/10 px-3 py-2 text-sm"
                                    />
                                    <textarea
                                      value={editForm.description}
                                      onChange={(event) =>
                                        setEditForm((prev) => ({
                                          ...prev,
                                          description: event.target.value
                                        }))
                                      }
                                      placeholder={t(dict, "admin.dashboard.descriptionPlaceholder")}
                                      rows={2}
                                      className="w-full rounded-md border border-brand-ink/10 px-3 py-2 text-sm"
                                    />
                                    <div className="grid gap-3 sm:grid-cols-2">
                                      <input
                                        value={editForm.price}
                                        onChange={(event) =>
                                          setEditForm((prev) => ({
                                            ...prev,
                                            price: event.target.value
                                          }))
                                        }
                                        placeholder={t(dict, "admin.dashboard.pricePlaceholder")}
                                        className="w-full rounded-md border border-brand-ink/10 px-3 py-2 text-sm"
                                      />
                                      <input
                                        value={editForm.currency}
                                        onChange={(event) =>
                                          setEditForm((prev) => ({
                                            ...prev,
                                            currency: event.target.value
                                          }))
                                        }
                                        placeholder={t(dict, "admin.dashboard.currencyPlaceholder")}
                                        className="w-full rounded-md border border-brand-ink/10 px-3 py-2 text-sm"
                                      />
                                    </div>
                                    <div className="grid gap-3 sm:grid-cols-2">
                                      <input
                                        value={editForm.preparationTime}
                                        onChange={(event) =>
                                          setEditForm((prev) => ({
                                            ...prev,
                                            preparationTime: event.target.value
                                          }))
                                        }
                                        placeholder={t(dict, "admin.dashboard.prepTimePlaceholder")}
                                        className="w-full rounded-md border border-brand-ink/10 px-3 py-2 text-sm"
                                      />
                                      <select
                                        value={editForm.categoryId}
                                        onChange={(event) =>
                                          setEditForm((prev) => ({
                                            ...prev,
                                            categoryId: event.target.value
                                          }))
                                        }
                                        className="w-full rounded-md border border-brand-ink/10 px-3 py-2 text-sm"
                                      >
                                        <option value="">{t(dict, "admin.dashboard.categoryPlaceholder")}</option>
                                        {categoriesQuery.data?.categories.map((categoryOption) => (
                                          <option key={categoryOption.id} value={categoryOption.id}>
                                            {categoryOption.name}
                                          </option>
                                        ))}
                                      </select>
                                    </div>
                                    <input
                                      value={editForm.imageUrl}
                                      onChange={(event) =>
                                        setEditForm((prev) => ({
                                          ...prev,
                                          imageUrl: event.target.value
                                        }))
                                      }
                                      placeholder={t(dict, "admin.dashboard.imageUrlPlaceholder")}
                                      className="w-full rounded-md border border-brand-ink/10 px-3 py-2 text-sm"
                                    />
                                    <label className="flex items-center gap-2 text-xs text-brand-ink/70">
                                      <input
                                        type="checkbox"
                                        checked={editForm.isAvailable}
                                        onChange={(event) =>
                                          setEditForm((prev) => ({
                                            ...prev,
                                            isAvailable: event.target.checked
                                          }))
                                        }
                                      />
                                      {t(dict, "admin.dashboard.available")}
                                    </label>
                                    <div className="flex items-center gap-2">
                                      <button
                                        onClick={() =>
                                          updateMutation.mutate({ id: item.id, form: editForm })
                                        }
                                        disabled={updateMutation.isPending}
                                        className="rounded-md bg-brand-ink px-4 py-2 text-xs font-semibold text-white disabled:bg-brand-ink/30"
                                      >
                                        {updateMutation.isPending ? t(dict, "admin.dashboard.saving") : t(dict, "admin.dashboard.save")}
                                      </button>
                                      <button
                                        onClick={() => setEditItemId(null)}
                                        className="rounded-md border border-brand-ink/10 px-4 py-2 text-xs"
                                      >
                                        {t(dict, "admin.dashboard.cancel")}
                                      </button>
                                    </div>
                                  </div>
                                ) : null}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}


  function renderOrderActions(order: AdminOrder, mutation: OrderStatusMutation, dict: DictionaryType) {
    const buttons: Array<{ labelKey: string; action: string; visible: boolean }> = [
      { labelKey: "accept", action: "accept", visible: order.status === "PENDING" },
      { labelKey: "startPrep", action: "start-prep", visible: order.status === "ACCEPTED" },
      { labelKey: "ready", action: "ready", visible: order.status === "PREPARING" },
      { labelKey: "outForDelivery", action: "out-for-delivery", visible: order.status === "READY" },
      { labelKey: "delivered", action: "delivered", visible: order.status === "OUT_FOR_DELIVERY" },
      { labelKey: "cancel", action: "cancel", visible: order.status !== "CANCELLED" && order.status !== "DELIVERED" }
    ];

    return buttons.filter((b) => b.visible).map((button) => (
        <button
          key={button.action}
          onClick={() => mutation.mutate({ orderId: order.id, action: button.action })}
          disabled={mutation.isPending}
          className="rounded-md border border-brand-ink/10 px-3 py-1 text-xs font-semibold text-brand-ink"
        >
          {mutation.isPending ? t(dict, "admin.updating") : t(dict, `admin.action.${button.labelKey}`)}
        </button>
      ));
  }

function formatCurrency(amountMinor: number, currency: string) {
  const formatter = new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency
  });
  return formatter.format(amountMinor / 100);
}

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("en-NG", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function findCategoryId(itemId: string, categories: MenuCategory[]) {
  for (const category of categories) {
    if (category.items.some((item) => item.id === itemId)) {
      return category.id;
    }
  }
  return null;
}
