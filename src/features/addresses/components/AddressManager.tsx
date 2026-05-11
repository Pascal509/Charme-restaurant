"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import AddressForm from "@/features/addresses/components/AddressForm";
import type { AddressInput, AddressRecord } from "@/features/addresses/types";
import { useUserIdentity } from "@/hooks/useUserIdentity";
import { t, type DictionaryType } from "@/lib/i18n";

const GUEST_STORAGE_KEY = "guestAddresses";

type AddressManagerProps = {
  dict: DictionaryType;
};

export default function AddressManager({ dict }: AddressManagerProps) {
  const { status } = useSession();
  const { userId, loading: identityLoading, error: identityError } = useUserIdentity(t(dict, "addressManager.identityError"));
  const queryClient = useQueryClient();
  const [guestAddresses, setGuestAddresses] = useState<AddressRecord[]>([]);
  const [editing, setEditing] = useState<AddressRecord | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const isAuthenticated = status === "authenticated" && Boolean(userId);

  const addressesQuery = useQuery<{ addresses: AddressRecord[] }>({
    queryKey: ["addresses", userId],
    enabled: isAuthenticated,
    queryFn: async () => {
      const response = await fetch(`/api/addresses?userId=${userId}`);
      if (!response.ok) {
        throw new Error(t(dict, "addressManager.loadError"));
      }
      return response.json();
    }
  });

  useEffect(() => {
    if (isAuthenticated) return;
    const stored = readGuestAddresses();
    setGuestAddresses(stored);
  }, [isAuthenticated]);

  const addresses = useMemo(() => {
    if (isAuthenticated) {
      return (addressesQuery.data?.addresses ?? []).map((address) =>
        normalizeAddress({
          ...address,
          source: "account" as const
        })
      );
    }
    return guestAddresses;
  }, [addressesQuery.data, guestAddresses, isAuthenticated]);

  async function handleSave(input: AddressInput) {
    setActionError(null);

    if (isAuthenticated) {
      if (!userId) {
        setActionError(t(dict, "addressManager.identityNotReady"));
        return;
      }

      const payload = { ...input, userId };
      if (editing) {
        const response = await fetch(`/api/addresses/${editing.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          setActionError(t(dict, "addressManager.updateError"));
          return;
        }
      } else {
        const response = await fetch("/api/addresses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          setActionError(t(dict, "addressManager.saveError"));
          return;
        }
      }

      await queryClient.invalidateQueries({ queryKey: ["addresses", userId] });
    } else {
      const updated = upsertGuestAddress(guestAddresses, editing, input);
      persistGuestAddresses(updated);
      setGuestAddresses(updated);
    }

    setEditing(null);
    setShowForm(false);
  }

  async function handleDelete(address: AddressRecord) {
    setActionError(null);

    if (isAuthenticated) {
      if (!userId) return;
      const response = await fetch(`/api/addresses/${address.id}?userId=${userId}`, {
        method: "DELETE"
      });
      if (!response.ok) {
        setActionError(t(dict, "addressManager.deleteError"));
        return;
      }
      await queryClient.invalidateQueries({ queryKey: ["addresses", userId] });
    } else {
      const updated = guestAddresses.filter((item) => item.id !== address.id);
      persistGuestAddresses(updated);
      setGuestAddresses(updated);
    }
  }

  async function handleSetDefault(address: AddressRecord) {
    setActionError(null);

    if (isAuthenticated) {
      if (!userId) return;
      const response = await fetch(`/api/addresses/${address.id}/set-default`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId })
      });
      if (!response.ok) {
        setActionError(t(dict, "addressManager.defaultError"));
        return;
      }
      await queryClient.invalidateQueries({ queryKey: ["addresses", userId] });
    } else {
      const updated = guestAddresses.map((item) => ({
        ...item,
        isDefault: item.id === address.id
      }));
      persistGuestAddresses(updated);
      setGuestAddresses(updated);
    }
  }

  const loading = addressesQuery.isLoading || identityLoading;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-brand-ink">{t(dict, "account.savedAddresses")}</h3>
        <button
          onClick={() => {
            setEditing(null);
            setShowForm((prev) => !prev);
          }}
          className="text-xs font-semibold text-brand-ink"
        >
          {showForm ? t(dict, "common.close") : t(dict, "checkout.addNew")}
        </button>
      </div>

      {identityError ? (
        <div className="rounded-md border border-brand-cinnabar/30 bg-brand-cinnabar/5 px-3 py-2 text-sm text-brand-cinnabar">
          {identityError}
        </div>
      ) : null}

      {actionError ? (
        <div className="rounded-md border border-brand-cinnabar/30 bg-brand-cinnabar/5 px-3 py-2 text-sm text-brand-cinnabar">
          {actionError}
        </div>
      ) : null}

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 2 }).map((_, index) => (
            <div key={index} className="h-16 rounded-lg bg-brand-ink/10" />
          ))}
        </div>
      ) : addresses.length === 0 ? (
        <div className="rounded-md border border-brand-ink/10 bg-brand-ink/5 px-3 py-3 text-sm text-brand-ink/60">
          {t(dict, "addressManager.empty")}
        </div>
      ) : (
        <div className="space-y-3">
          {addresses.map((address) => (
            <div
              key={address.id}
              className="rounded-lg border border-brand-ink/10 px-4 py-3 text-sm"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-brand-ink">{address.label}</p>
                  <p className="text-xs text-brand-ink/60">
                    {address.fullName} · {address.phone}
                  </p>
                  <p className="text-xs text-brand-ink/60">
                    {address.addressLine1}
                    {address.addressLine2 ? `, ${address.addressLine2}` : ""}, {address.city}
                  </p>
                  <p className="text-xs text-brand-ink/60">
                    {address.state}, {address.country}
                  </p>
                </div>
                {address.isDefault ? (
                    <span className="rounded-full bg-brand-jade/10 px-2 py-1 text-[10px] font-semibold text-brand-jade">
                    {t(dict, "addressManager.defaultLabel")}
                  </span>
                ) : null}
              </div>

              <div className="mt-3 flex flex-wrap gap-3 text-xs text-brand-ink/70">
                  <button onClick={() => handleSetDefault(address)} className="font-semibold">
                  {t(dict, "addressManager.setDefault")}
                </button>
                <button
                  onClick={() => {
                    setEditing(address);
                    setShowForm(true);
                  }}
                  className="font-semibold"
                >
                  {t(dict, "addressManager.edit")}
                </button>
                <button onClick={() => handleDelete(address)} className="font-semibold text-brand-cinnabar">
                  {t(dict, "addressManager.delete")}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm ? (
        <div className="rounded-lg border border-brand-ink/10 bg-brand-rice p-4">
          <AddressForm
            initial={editing}
            onSubmit={handleSave}
            onCancel={() => {
              setEditing(null);
              setShowForm(false);
            }}
            requireGeo={isAuthenticated}
            dict={dict}
          />
        </div>
      ) : null}
    </div>
  );
}

function readGuestAddresses(): AddressRecord[] {
  if (typeof window === "undefined") return [] as AddressRecord[];
  const raw = window.localStorage.getItem(GUEST_STORAGE_KEY);
  if (!raw) return [] as AddressRecord[];
  try {
    const parsed = JSON.parse(raw) as AddressRecord[];
    return parsed.map((entry) => ({ ...entry, source: "guest" as const }));
  } catch {
    return [] as AddressRecord[];
  }
}

function persistGuestAddresses(addresses: AddressRecord[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(addresses));
}

function upsertGuestAddress(
  current: AddressRecord[],
  editing: AddressRecord | null,
  input: AddressInput
): AddressRecord[] {
  if (editing) {
    return current.map((address) =>
      address.id === editing.id
        ? {
            ...address,
            ...input,
            source: "guest" as const
          }
        : address
    );
  }

  const id = typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `guest_addr_${Date.now()}_${Math.random().toString(16).slice(2)}`;

  return [
    {
      id,
      ...input,
      source: "guest" as const
    },
    ...current
  ];
}

function normalizeAddress(address: AddressRecord) {
  return {
    ...address,
    latitude: address.latitude !== null && address.latitude !== undefined
      ? Number(address.latitude)
      : null,
    longitude: address.longitude !== null && address.longitude !== undefined
      ? Number(address.longitude)
      : null
  } as AddressRecord;
}
