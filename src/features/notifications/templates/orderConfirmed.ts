import type { NotificationTemplatePayload } from "@/features/notifications/types";

export function orderConfirmedTemplate(params: { orderId: string }) : NotificationTemplatePayload {
  const title = "Order confirmed";
  const message = `Your order ${params.orderId} has been confirmed.`;
  const emailHtml = `<p>${message}</p>`;
  const smsText = `Order ${params.orderId} confirmed.`;

  return { title, message, emailHtml, smsText };
}
