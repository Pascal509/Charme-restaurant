export type CheckoutSummary = {
  currency: string;
  subtotalAmountMinor: number;
  totalAmountMinor: number;
  orderId?: string;
};

export type CartTotals = {
  currency: string;
  subtotalAmountMinor: number;
  taxAmountMinor: number;
  deliveryAmountMinor: number;
  loyaltyDiscountMinor?: number;
  loyaltyPointsRedeemed?: number;
  totalAmountMinor: number;
};

export type CartValidationResponse = {
  valid: boolean;
  errors: string[];
  totals: CartTotals | null;
};

export type CheckoutSessionRequest = {
  cartId?: string;
  guestId?: string;
  userId?: string;
  paymentProvider: "STRIPE" | "FLUTTERWAVE";
  fulfillmentType: "DELIVERY" | "PICKUP";
  addressId?: string;
  pickupSlotId?: string;
  idempotencyKey: string;
  userCountry?: string;
  billingCountry?: string;
  ipCountry?: string;
  loyaltyPointsToRedeem?: number;
  rewardId?: string;
};

export type CheckoutSessionResponse = {
  checkoutUrl: string | null;
  orderId: string;
};
