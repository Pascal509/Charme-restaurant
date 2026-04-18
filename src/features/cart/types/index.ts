export type CartItemInput = {
  productVariantId?: string;
  menuItemId?: string;
  quantity: number;
  selectedOptions?: string[];
};

export type CartTotals = {
  subtotalAmountMinor: number;
  totalAmountMinor: number;
  currency: string;
};
