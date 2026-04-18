export type AddressRecord = {
  id: string;
  label: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  state: string;
  country: string;
  postalCode?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  isDefault?: boolean;
  source: "account" | "guest";
};

export type AddressInput = Omit<AddressRecord, "id" | "source">;
