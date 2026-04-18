"use client";

import { useMemo, useState } from "react";
import type { AddressInput, AddressRecord } from "@/features/addresses/types";

type AddressFormProps = {
  initial?: AddressRecord | null;
  onSubmit: (input: AddressInput) => Promise<void> | void;
  onCancel?: () => void;
  requireGeo?: boolean;
};

type FieldErrors = Partial<Record<keyof AddressInput, string>>;

const EMPTY_FORM: AddressInput = {
  label: "",
  fullName: "",
  phone: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  country: "",
  postalCode: "",
  latitude: null,
  longitude: null,
  isDefault: false
};

export default function AddressForm({ initial, onSubmit, onCancel, requireGeo }: AddressFormProps) {
  const [form, setForm] = useState<AddressInput>(() => ({
    ...EMPTY_FORM,
    ...(initial
      ? {
          label: initial.label,
          fullName: initial.fullName,
          phone: initial.phone,
          addressLine1: initial.addressLine1,
          addressLine2: initial.addressLine2 ?? "",
          city: initial.city,
          state: initial.state,
          country: initial.country,
          postalCode: initial.postalCode ?? "",
          latitude: initial.latitude ?? null,
          longitude: initial.longitude ?? null,
          isDefault: Boolean(initial.isDefault)
        }
      : {})
  }));
  const [errors, setErrors] = useState<FieldErrors>({});
  const [isSaving, setIsSaving] = useState(false);

  const showGeoHint = useMemo(() => Boolean(form.latitude || form.longitude), [form.latitude, form.longitude]);

  function updateField<K extends keyof AddressInput>(key: K, value: AddressInput[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function validate(): FieldErrors {
    const next: FieldErrors = {};
    if (!form.label.trim()) next.label = "Label is required";
    if (!form.fullName.trim()) next.fullName = "Full name is required";
    if (!form.phone.trim()) next.phone = "Phone is required";
    if (!form.addressLine1.trim()) next.addressLine1 = "Address line is required";
    if (!form.city.trim()) next.city = "City is required";
    if (!form.state.trim()) next.state = "State is required";
    if (!form.country.trim()) next.country = "Country is required";
    if (requireGeo) {
      if (form.latitude === null || Number.isNaN(form.latitude)) next.latitude = "Latitude required";
      if (form.longitude === null || Number.isNaN(form.longitude)) next.longitude = "Longitude required";
    }
    return next;
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setIsSaving(true);
    await onSubmit({
      ...form,
      addressLine2: form.addressLine2 || undefined,
      postalCode: form.postalCode || undefined,
      latitude: form.latitude ?? undefined,
      longitude: form.longitude ?? undefined
    });
    setIsSaving(false);
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field
          label="Label"
          value={form.label}
          onChange={(value) => updateField("label", value)}
          placeholder="Home, Office"
          error={errors.label}
        />
        <Field
          label="Full name"
          value={form.fullName}
          onChange={(value) => updateField("fullName", value)}
          placeholder="Recipient name"
          error={errors.fullName}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field
          label="Phone"
          value={form.phone}
          onChange={(value) => updateField("phone", value)}
          placeholder="Phone number"
          error={errors.phone}
        />
        <Field
          label="Country"
          value={form.country}
          onChange={(value) => updateField("country", value)}
          placeholder="Country"
          error={errors.country}
        />
      </div>

      <Field
        label="Address line 1"
        value={form.addressLine1}
        onChange={(value) => updateField("addressLine1", value)}
        placeholder="Street address"
        error={errors.addressLine1}
      />

      <Field
        label="Address line 2"
        value={form.addressLine2 ?? ""}
        onChange={(value) => updateField("addressLine2", value)}
        placeholder="Apartment, suite"
        optional
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <Field
          label="City"
          value={form.city}
          onChange={(value) => updateField("city", value)}
          placeholder="City"
          error={errors.city}
        />
        <Field
          label="State"
          value={form.state}
          onChange={(value) => updateField("state", value)}
          placeholder="State"
          error={errors.state}
        />
        <Field
          label="Postal code"
          value={form.postalCode ?? ""}
          onChange={(value) => updateField("postalCode", value)}
          placeholder="Postal code"
          optional
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field
          label="Latitude"
          value={form.latitude !== null && form.latitude !== undefined ? String(form.latitude) : ""}
          onChange={(value) => updateField("latitude", value ? Number(value) : null)}
          placeholder="Latitude"
          error={errors.latitude}
          optional={!requireGeo}
        />
        <Field
          label="Longitude"
          value={form.longitude !== null && form.longitude !== undefined ? String(form.longitude) : ""}
          onChange={(value) => updateField("longitude", value ? Number(value) : null)}
          placeholder="Longitude"
          error={errors.longitude}
          optional={!requireGeo}
        />
      </div>

      {showGeoHint ? (
        <div className="rounded-md border border-brand-ink/10 bg-brand-ink/5 px-3 py-2 text-xs text-brand-ink/70">
          Map preview: {form.latitude}, {form.longitude}
        </div>
      ) : null}

      <label className="flex items-center gap-2 text-xs text-brand-ink/70">
        <input
          type="checkbox"
          checked={Boolean(form.isDefault)}
          onChange={(event) => updateField("isDefault", event.target.checked)}
        />
        Set as default address
      </label>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-brand-ink/20 px-4 py-2 text-sm font-semibold text-brand-ink"
          >
            Cancel
          </button>
        ) : null}
        <button
          type="submit"
          disabled={isSaving}
          className="rounded-md bg-brand-cinnabar px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-brand-cinnabar/60"
        >
          {isSaving ? "Saving..." : "Save address"}
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  optional,
  error
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  optional?: boolean;
  error?: string;
}) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-ink/60">
        {label} {optional ? <span className="text-brand-ink/40">(optional)</span> : null}
      </label>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-md border border-brand-ink/10 px-3 py-2 text-sm text-brand-ink"
      />
      {error ? <p className="text-xs text-brand-cinnabar">{error}</p> : null}
    </div>
  );
}
