import type { NotificationTemplatePayload } from "@/features/notifications/types";

export function orderReadyTemplate(params: { orderId: string }) : NotificationTemplatePayload {
  const title = "Order ready";
  const message = `Your order ${params.orderId} is ready.`;
  const emailHtml = `<p>${message}</p>`;
  const smsText = `Order ${params.orderId} is ready.`;

  return { title, message, emailHtml, smsText };
}
