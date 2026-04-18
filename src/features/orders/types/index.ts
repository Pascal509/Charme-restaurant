export type OrderSummary = {
  id: string;
  status:
    | "PENDING"
    | "ACCEPTED"
    | "PREPARING"
    | "READY"
    | "OUT_FOR_DELIVERY"
    | "DELIVERED"
    | "CANCELLED"
    | "FAILED";
  totalAmountMinor: number;
  currency: string;
};
