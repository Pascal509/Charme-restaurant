import { Money } from "@/lib/money";

export type TaxBreakdown = {
  model: "VAT" | "GST" | "SALES_TAX";
  inclusive: boolean;
  rateBps: number;
  taxAmountMinor: number;
  totalAmountMinor: number;
};

export function calculateTax(params: {
  subtotal: Money;
  taxModel: "VAT" | "GST" | "SALES_TAX";
  taxInclusive: boolean;
  taxRateBps: number;
}) {
  const rate = params.taxRateBps / 10000;

  if (params.taxRateBps <= 0) {
    return {
      model: params.taxModel,
      inclusive: params.taxInclusive,
      rateBps: params.taxRateBps,
      taxAmountMinor: 0,
      totalAmountMinor: params.subtotal.amountMinor
    } as TaxBreakdown;
  }

  if (params.taxInclusive) {
    const net = Math.round(params.subtotal.amountMinor / (1 + rate));
    const taxAmountMinor = params.subtotal.amountMinor - net;
    return {
      model: params.taxModel,
      inclusive: true,
      rateBps: params.taxRateBps,
      taxAmountMinor,
      totalAmountMinor: params.subtotal.amountMinor
    } as TaxBreakdown;
  }

  const taxAmountMinor = Math.round(params.subtotal.amountMinor * rate);
  return {
    model: params.taxModel,
    inclusive: false,
    rateBps: params.taxRateBps,
    taxAmountMinor,
    totalAmountMinor: params.subtotal.amountMinor + taxAmountMinor
  } as TaxBreakdown;
}
