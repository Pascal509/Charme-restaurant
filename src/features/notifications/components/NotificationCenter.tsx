"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";

const NOTIFICATIONS_ENDPOINT = "/api/notifications";
const PREFERENCES_ENDPOINT = "/api/notification-preferences";
const READ_STORAGE_KEY = "notificationReadIds";

const CHANNELS = ["EMAIL", "SMS", "PUSH"] as const;
const TYPES = [
  "ORDER_CONFIRMED",
  "ORDER_PREPARING",
  "ORDER_READY",
  "ORDER_OUT_FOR_DELIVERY",
  "ORDER_DELIVERED",
  "PAYMENT_FAILED"
] as const;

type NotificationChannel = (typeof CHANNELS)[number];
type NotificationType = (typeof TYPES)[number];

type NotificationLog = {
  id: string;
  orderId?: string | null;
  type: NotificationType;
  channel: NotificationChannel;
  status: string;
  payload?: { title?: string; message?: string } | null;
  createdAt: string;
};

type NotificationPreference = {
  type: NotificationType;
  channel: NotificationChannel;
  enabled: boolean;
};

type NotificationResponse = {
  notifications: NotificationLog[];
};

type PreferenceResponse = {
  preferences: NotificationPreference[];
};

export default function NotificationCenter() {
  const { status } = useSession();
  const [open, setOpen] = useState(false);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [updating, setUpdating] = useState<string | null>(null);

  const notificationsQuery = useQuery<NotificationResponse>({
    queryKey: ["notifications"],
    enabled: status === "authenticated",
    queryFn: async () => {
      const response = await fetch(`${NOTIFICATIONS_ENDPOINT}?limit=20`);
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || "Failed to load notifications");
      }
      return response.json();
    },
    refetchInterval: 30000,
    refetchOnWindowFocus: true
  });

  const preferencesQuery = useQuery<PreferenceResponse>({
    queryKey: ["notification-preferences"],
    enabled: status === "authenticated" && open,
    queryFn: async () => {
      const response = await fetch(PREFERENCES_ENDPOINT);
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || "Failed to load preferences");
      }
      return response.json();
    }
  });

  useEffect(() => {
    setReadIds(loadReadIds());
  }, []);

  const notifications = notificationsQuery.data?.notifications ?? [];
  const unreadCount = notifications.filter((item) => !readIds.has(item.id)).length;
  const preferenceMap = useMemo(() => {
    const map = new Map<string, boolean>();
    (preferencesQuery.data?.preferences ?? []).forEach((pref) => {
      map.set(`${pref.type}:${pref.channel}`, pref.enabled);
    });
    return map;
  }, [preferencesQuery.data]);

  async function togglePreference(type: NotificationType, channel: NotificationChannel) {
    const key = `${type}:${channel}`;
    const next = !preferenceMap.get(key);
    setUpdating(key);

    const response = await fetch(PREFERENCES_ENDPOINT, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, channel, enabled: next })
    });

    setUpdating(null);

    if (!response.ok) {
      return;
    }

    await preferencesQuery.refetch();
  }

  function markAllRead() {
    const ids = new Set(readIds);
    notifications.forEach((item) => ids.add(item.id));
    persistReadIds(ids);
    setReadIds(ids);
  }

  function markRead(id: string) {
    const ids = new Set(readIds);
    ids.add(id);
    persistReadIds(ids);
    setReadIds(ids);
  }

  if (status !== "authenticated") return null;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="relative rounded-full border border-brand-ink/20 px-3 py-2 text-xs font-semibold text-brand-ink"
        aria-expanded={open}
        aria-haspopup="true"
      >
        <span className="sr-only">Notifications</span>
        <span role="img" aria-hidden="true">
          🔔
        </span>
        {unreadCount > 0 ? (
          <span className="absolute -right-2 -top-2 rounded-full bg-brand-cinnabar px-2 py-0.5 text-[10px] font-semibold text-white">
            {unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 mt-3 w-[320px] origin-top-right rounded-xl border border-brand-ink/10 bg-white p-4 shadow-crisp transition duration-200 ease-out">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-brand-ink">Notifications</p>
            <button onClick={markAllRead} className="text-xs font-semibold text-brand-ink/70">
              Mark all read
            </button>
          </div>

          {notificationsQuery.isLoading ? (
            <div className="mt-4 space-y-2">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="h-12 rounded-lg bg-brand-ink/10" />
              ))}
            </div>
          ) : notificationsQuery.isError ? (
            <div className="mt-4 rounded-md border border-brand-cinnabar/30 bg-brand-cinnabar/5 px-3 py-2 text-sm text-brand-cinnabar">
              Unable to load notifications.
            </div>
          ) : notifications.length === 0 ? (
            <div className="mt-4 rounded-md border border-brand-ink/10 bg-brand-ink/5 px-3 py-3 text-sm text-brand-ink/60">
              No notifications yet.
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {notifications.map((item) => (
                <button
                  key={item.id}
                  onClick={() => markRead(item.id)}
                  className={`flex w-full flex-col gap-1 rounded-lg border px-3 py-2 text-left text-xs transition ${
                    readIds.has(item.id)
                      ? "border-brand-ink/10 bg-white text-brand-ink/60"
                      : "border-brand-ink/20 bg-brand-ink/5 text-brand-ink"
                  }`}
                >
                  <span className="text-[10px] uppercase tracking-[0.2em] text-brand-ink/50">
                    {formatType(item.type)}
                  </span>
                  <span className="text-sm font-semibold">{item.payload?.title || "Update"}</span>
                  <span className="text-xs text-brand-ink/60">
                    {item.payload?.message || "New activity"}
                  </span>
                  <span className="text-[10px] text-brand-ink/40">
                    {formatTime(item.createdAt)}
                  </span>
                </button>
              ))}
            </div>
          )}

          <div className="mt-6 border-t border-brand-ink/10 pt-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-ink/50">
              Preferences
            </p>
            {preferencesQuery.isLoading ? (
              <div className="mt-3 space-y-2">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="h-10 rounded-lg bg-brand-ink/10" />
                ))}
              </div>
            ) : (
              <div className="mt-3 space-y-3">
                {TYPES.map((type) => (
                  <div key={type} className="rounded-lg border border-brand-ink/10 px-3 py-2">
                    <p className="text-xs font-semibold text-brand-ink">{formatType(type)}</p>
                    <div className="mt-2 flex flex-wrap gap-3">
                      {CHANNELS.map((channel) => {
                        const key = `${type}:${channel}`;
                        const enabled = preferenceMap.has(key) ? preferenceMap.get(key) : true;
                        return (
                          <label key={key} className="flex items-center gap-2 text-xs text-brand-ink/70">
                            <input
                              type="checkbox"
                              checked={Boolean(enabled)}
                              onChange={() => togglePreference(type, channel)}
                              disabled={updating === key}
                            />
                            {channel}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function formatType(type: NotificationType) {
  return type.replace(/_/g, " ").toLowerCase();
}

function formatTime(value: string) {
  const date = new Date(value);
  return date.toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" });
}

function loadReadIds() {
  if (typeof window === "undefined") return new Set<string>();
  const raw = window.localStorage.getItem(READ_STORAGE_KEY);
  if (!raw) return new Set<string>();
  try {
    const parsed = JSON.parse(raw) as string[];
    return new Set(parsed);
  } catch {
    return new Set<string>();
  }
}

function persistReadIds(ids: Set<string>) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(READ_STORAGE_KEY, JSON.stringify(Array.from(ids)));
}
