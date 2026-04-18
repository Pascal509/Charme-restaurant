import type { NotificationTemplatePayload } from "@/features/notifications/types";

export function orderDeliveredTemplate(params: { orderId: string }) : NotificationTemplatePayload {
  const title = "Order delivered";
  const message = `Your order ${params.orderId} has been delivered.`;
  const emailHtml = `<p>${message}</p>`;
  const smsText = `Order ${params.orderId} delivered.`;

  return { title, message, emailHtml, smsText };
}
