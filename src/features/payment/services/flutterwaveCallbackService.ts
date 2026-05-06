import { Money } from "@/lib/money";
import { updatePaymentFromWebhook } from "@/features/payment/services/paymentService";
import { verifyFlutterwaveTransaction } from "@/features/payment/services/providers/flutterwaveGateway";

export type FlutterwaveCallbackResult = {
  transactionId: string;
  reference: string | null;
  status: "PAID" | "FAILED";
  updateStatus: string;
};

export async function processFlutterwaveCallback(params: {
  transactionId: string;
  reference?: string | null;
  payload: string;
}) {
  const verification = await verifyFlutterwaveTransaction(params.transactionId);
  const data = verification.data;
  const resolvedReference = data.tx_ref ?? params.reference ?? null;

  if (params.reference && data.tx_ref && params.reference !== data.tx_ref) {
    throw new Error("Flutterwave transaction reference mismatch");
  }

  const money = Money.fromMajor(data.amount, data.currency.toUpperCase());
  const status = data.status.toLowerCase() === "successful" ? "PAID" : "FAILED";

  const result = await updatePaymentFromWebhook({
    provider: "FLUTTERWAVE",
    eventId: String(data.id),
    providerPaymentId: String(data.id),
    reference: resolvedReference,
    status,
    amountMinor: money.amountMinor,
    currency: data.currency.toUpperCase(),
    payload: params.payload
  });

  return {
    transactionId: String(data.id),
    reference: resolvedReference,
    status,
    updateStatus: result.status
  } satisfies FlutterwaveCallbackResult;
}
