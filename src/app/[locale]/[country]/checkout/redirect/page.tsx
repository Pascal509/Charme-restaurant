import { redirect } from "next/navigation";
import { processFlutterwaveCallback } from "@/features/payment/services/flutterwaveCallbackService";

export default async function CheckoutRedirectPage({
  params,
  searchParams
}: {
  params: { locale: string; country: string };
  searchParams: { transaction_id?: string; tx_ref?: string; status?: string };
}) {
  const basePath = `/${params.locale}/${params.country}`;
  const transactionId = searchParams.transaction_id;
  const reference = searchParams.tx_ref ?? null;

  if (!transactionId) {
    redirect(`${basePath}/checkout/failed`);
  }

  try {
    const result = await processFlutterwaveCallback({
      transactionId,
      reference,
      payload: JSON.stringify({
        transaction_id: transactionId,
        tx_ref: reference,
        status: searchParams.status ?? null,
        source: "redirect"
      })
    });

    const orderQuery = result.reference ? `?orderId=${encodeURIComponent(result.reference)}` : "";

    if (result.status === "PAID") {
      redirect(`${basePath}/checkout/success${orderQuery}`);
    }

    redirect(`${basePath}/checkout/failed${orderQuery}`);
  } catch {
    redirect(`${basePath}/checkout/failed`);
  }
}
