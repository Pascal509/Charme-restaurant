const DEFAULT_DECIMALS = 2;

const currencyDecimals: Record<string, number> = {
  NGN: 2,
  USD: 2,
  CNY: 2
};

export class Money {
  readonly amountMinor: number;
  readonly currency: string;

  constructor(amountMinor: number, currency: string) {
    if (!Number.isInteger(amountMinor)) {
      throw new Error("amountMinor must be an integer");
    }
    this.amountMinor = amountMinor;
    this.currency = currency.toUpperCase();
  }

  static fromMajor(amountMajor: number, currency: string) {
    const decimals = currencyDecimals[currency.toUpperCase()] ?? DEFAULT_DECIMALS;
    const minor = Math.round(amountMajor * 10 ** decimals);
    return new Money(minor, currency);
  }

  toMajor(): number {
    const decimals = currencyDecimals[this.currency] ?? DEFAULT_DECIMALS;
    return this.amountMinor / 10 ** decimals;
  }

  formatMajor(): string {
    const decimals = currencyDecimals[this.currency] ?? DEFAULT_DECIMALS;
    return (this.amountMinor / 10 ** decimals).toFixed(decimals);
  }

  add(other: Money) {
    this.assertSameCurrency(other);
    return new Money(this.amountMinor + other.amountMinor, this.currency);
  }

  subtract(other: Money) {
    this.assertSameCurrency(other);
    return new Money(this.amountMinor - other.amountMinor, this.currency);
  }

  multiply(multiplier: number) {
    if (!Number.isFinite(multiplier)) {
      throw new Error("Multiplier must be finite");
    }
    return new Money(Math.round(this.amountMinor * multiplier), this.currency);
  }

  assertSameCurrency(other: Money) {
    if (this.currency !== other.currency) {
      throw new Error("Currency mismatch");
    }
  }
}
