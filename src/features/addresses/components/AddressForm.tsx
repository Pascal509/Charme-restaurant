"use client";

import { useId, useMemo, useState } from "react";
import type { AddressInput, AddressRecord } from "@/features/addresses/types";
import { t, type DictionaryType } from "@/lib/i18n";

type AddressFormProps = {
  initial?: AddressRecord | null;
  onSubmit: (input: AddressInput) => Promise<void> | void;
  onCancel?: () => void;
  requireGeo?: boolean;
  dict: DictionaryType;
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

export default function AddressForm({ initial, onSubmit, onCancel, requireGeo, dict }: AddressFormProps) {
  const formId = useId();
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
    if (!form.label.trim()) next.label = t(dict, "addressForm.labelRequired");
    if (!form.fullName.trim()) next.fullName = t(dict, "addressForm.fullNameRequired");
    if (!form.phone.trim()) next.phone = t(dict, "addressForm.phoneRequired");
    if (!form.addressLine1.trim()) next.addressLine1 = t(dict, "addressForm.addressRequired");
    if (!form.city.trim()) next.city = t(dict, "addressForm.cityRequired");
    if (!form.state.trim()) next.state = t(dict, "addressForm.stateRequired");
    if (!form.country.trim()) next.country = t(dict, "addressForm.countryRequired");
    if (requireGeo) {
      if (form.latitude === null || Number.isNaN(form.latitude)) next.latitude = t(dict, "addressForm.latitudeRequired");
      if (form.longitude === null || Number.isNaN(form.longitude)) next.longitude = t(dict, "addressForm.longitudeRequired");
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
    <form onSubmit={handleSubmit} className="grid gap-4" aria-busy={isSaving} noValidate>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field
          inputId={`${formId}-label`}
          dict={dict}
          label={t(dict, "addressForm.label")}
          value={form.label}
          onChange={(value) => updateField("label", value)}
          placeholder={t(dict, "addressForm.labelPlaceholder")}
          error={errors.label}
        />
        <Field
          inputId={`${formId}-fullName`}
          dict={dict}
          label={t(dict, "addressForm.fullName")}
          value={form.fullName}
          onChange={(value) => updateField("fullName", value)}
          placeholder={t(dict, "addressForm.fullNamePlaceholder")}
          error={errors.fullName}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field
          inputId={`${formId}-phone`}
          dict={dict}
          label={t(dict, "addressForm.phone")}
          value={form.phone}
          onChange={(value) => updateField("phone", value)}
          placeholder={t(dict, "addressForm.phonePlaceholder")}
          error={errors.phone}
        />
        <Field
          inputId={`${formId}-country`}
          dict={dict}
          label={t(dict, "addressForm.country")}
          value={form.country}
          onChange={(value) => updateField("country", value)}
          placeholder={t(dict, "addressForm.countryPlaceholder")}
          error={errors.country}
        />
      </div>

      <Field
        inputId={`${formId}-addressLine1`}
        dict={dict}
        label={t(dict, "addressForm.addressLine1")}
        value={form.addressLine1}
        onChange={(value) => updateField("addressLine1", value)}
        placeholder={t(dict, "addressForm.addressLine1Placeholder")}
        error={errors.addressLine1}
      />

      <Field
        inputId={`${formId}-addressLine2`}
        dict={dict}
        label={t(dict, "addressForm.addressLine2")}
        value={form.addressLine2 ?? ""}
        onChange={(value) => updateField("addressLine2", value)}
        placeholder={t(dict, "addressForm.addressLine2Placeholder")}
        optional
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <Field
          inputId={`${formId}-city`}
          dict={dict}
          label={t(dict, "addressForm.city")}
          value={form.city}
          onChange={(value) => updateField("city", value)}
          placeholder={t(dict, "addressForm.cityPlaceholder")}
          error={errors.city}
        />
        <Field
          inputId={`${formId}-state`}
          dict={dict}
          label={t(dict, "addressForm.state")}
          value={form.state}
          onChange={(value) => updateField("state", value)}
          placeholder={t(dict, "addressForm.statePlaceholder")}
          error={errors.state}
        />
        <Field
          inputId={`${formId}-postalCode`}
          dict={dict}
          label={t(dict, "addressForm.postalCode")}
          value={form.postalCode ?? ""}
          onChange={(value) => updateField("postalCode", value)}
          placeholder={t(dict, "addressForm.postalCodePlaceholder")}
          optional
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field
          inputId={`${formId}-latitude`}
          dict={dict}
          label={t(dict, "addressForm.latitude")}
          value={form.latitude !== null && form.latitude !== undefined ? String(form.latitude) : ""}
          onChange={(value) => updateField("latitude", value ? Number(value) : null)}
          placeholder={t(dict, "addressForm.latitudePlaceholder")}
          error={errors.latitude}
          optional={!requireGeo}
        />
        <Field
          inputId={`${formId}-longitude`}
          dict={dict}
          label={t(dict, "addressForm.longitude")}
          value={form.longitude !== null && form.longitude !== undefined ? String(form.longitude) : ""}
          onChange={(value) => updateField("longitude", value ? Number(value) : null)}
          placeholder={t(dict, "addressForm.longitudePlaceholder")}
          error={errors.longitude}
          optional={!requireGeo}
        />
      </div>

      {showGeoHint ? (
        <div className="rounded-md border border-brand-ink/10 bg-brand-ink/5 px-3 py-2 text-xs text-brand-ink/70">
          {t(dict, "addressForm.mapPreview")}: {form.latitude}, {form.longitude}
        </div>
      ) : null}

      <label className="flex items-center gap-2 text-xs text-brand-ink/70">
        <input
          type="checkbox"
          checked={Boolean(form.isDefault)}
          onChange={(event) => updateField("isDefault", event.target.checked)}
          className="h-4 w-4 accent-brand-gold"
        />
        {t(dict, "addressForm.defaultAddress")}
      </label>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-brand-ink/20 px-4 py-2 text-sm font-semibold text-brand-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold/60"
          >
            {t(dict, "common.cancel")}
          </button>
        ) : null}
        <button
          type="submit"
          disabled={isSaving}
          className="rounded-md bg-brand-cinnabar px-4 py-2 text-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold/60 disabled:cursor-not-allowed disabled:bg-brand-cinnabar/60"
        >
          {isSaving ? t(dict, "addressForm.saving") : t(dict, "addressForm.saveAddress")}
        </button>
      </div>
    </form>
  );
}

function Field({
  inputId,
  dict,
  label,
  value,
  onChange,
  placeholder,
  optional,
  error
}: {
  inputId: string;
  dict: DictionaryType;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  optional?: boolean;
  error?: string;
}) {
  const errorId = `${inputId}-error`;
  return (
    <div className="space-y-2">
      <label htmlFor={inputId} className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-ink/60">
        {label} {optional ? <span className="text-brand-ink/40">{t(dict, "addressForm.optional")}</span> : null}
      </label>
      <input
        id={inputId}
        name={inputId}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        className="w-full rounded-md border border-brand-ink/10 px-3 py-2 text-sm text-brand-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold/60"
      />
      {error ? <p id={errorId} className="text-xs text-brand-cinnabar" role="alert">{error}</p> : null}
    </div>
  );
}
