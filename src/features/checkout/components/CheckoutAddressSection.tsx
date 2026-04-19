"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import AddressForm from "@/features/addresses/components/AddressForm";
import type { AddressInput, AddressRecord } from "@/features/addresses/types";
import { useUserIdentity } from "@/hooks/useUserIdentity";

const GUEST_STORAGE_KEY = "guestAddresses";

type CheckoutAddressSectionProps = {
  onSelectAddress: (addressId: string | null, requiresLogin: boolean) => void;
};

export default function CheckoutAddressSection({ onSelectAddress }: CheckoutAddressSectionProps) {
  const { status } = useSession();
  const { userId, loading: identityLoading, error: identityError } = useUserIdentity();
  const queryClient = useQueryClient();
  const [guestAddresses, setGuestAddresses] = useState<AddressRecord[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<AddressRecord | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const isAuthenticated = status === "authenticated" && Boolean(userId);

  const addressesQuery = useQuery<{ addresses: AddressRecord[] }>({
    queryKey: ["addresses", userId],
    enabled: isAuthenticated,
    queryFn: async () => {
      const response = await fetch(`/api/addresses?userId=${userId}`);
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || "Failed to load addresses");
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

  useEffect(() => {
    if (addresses.length === 0) {
      setSelectedId(null);
      onSelectAddress(null, !isAuthenticated);
      return;
    }

    const defaultAddress = addresses.find((address) => address.isDefault) ?? addresses[0];
    setSelectedId(defaultAddress.id);
    onSelectAddress(isAuthenticated ? defaultAddress.id : null, !isAuthenticated);
  }, [addresses, isAuthenticated, onSelectAddress]);

  async function handleSave(input: AddressInput) {
    setActionError(null);

    if (isAuthenticated) {
      if (!userId) {
        setActionError("User identity not ready");
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
          const error = await response.json().catch(() => ({}));
          setActionError(error.error || "Failed to update address");
          return;
        }
      } else {
        const response = await fetch("/api/addresses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          const error = await response.json().catch(() => ({}));
          setActionError(error.error || "Failed to save address");
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

  const loading = addressesQuery.isLoading || identityLoading;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-brand-ink">Delivery address</h3>
        <button
          onClick={() => {
            setEditing(null);
            setShowForm((prev) => !prev);
          }}
          className="text-xs font-semibold text-brand-ink"
        >
          {showForm ? "Close" : "Add new"}
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

      {!isAuthenticated ? (
        <div className="rounded-md border border-brand-ink/10 bg-brand-ink/5 px-3 py-3 text-sm text-brand-ink/70">
          Sign in to validate delivery coverage and save addresses to your account.
        </div>
      ) : null}

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 2 }).map((_, index) => (
            <div key={index} className="h-14 rounded-lg bg-brand-ink/10" />
          ))}
        </div>
      ) : addresses.length === 0 ? (
        <div className="rounded-md border border-brand-ink/10 bg-brand-ink/5 px-3 py-3 text-sm text-brand-ink/60">
          Add a delivery address to continue.
        </div>
      ) : (
        <div className="space-y-3">
          {addresses.map((address) => (
            <label
              key={address.id}
              className={`flex cursor-pointer items-start gap-3 rounded-lg border px-4 py-3 text-sm transition ${
                selectedId === address.id
                  ? "border-brand-ink bg-brand-ink text-brand-rice"
                  : "border-brand-ink/10 bg-white text-brand-ink"
              }`}
            >
              <input
                type="radio"
                name="deliveryAddress"
                checked={selectedId === address.id}
                onChange={() => {
                  setSelectedId(address.id);
                  onSelectAddress(isAuthenticated ? address.id : null, !isAuthenticated);
                }}
                className="mt-1"
              />
              <div>
                <p className="font-semibold">{address.label}</p>
                <p className="text-xs opacity-80">
                  {address.fullName} · {address.phone}
                </p>
                <p className="text-xs opacity-80">
                  {address.addressLine1}
                  {address.addressLine2 ? `, ${address.addressLine2}` : ""}, {address.city}
                </p>
                <p className="text-xs opacity-80">
                  {address.state}, {address.country}
                </p>
              </div>
            </label>
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
