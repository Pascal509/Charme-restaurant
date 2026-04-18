import type { NotificationTemplatePayload } from "@/features/notifications/types";

export function orderPreparingTemplate(params: { orderId: string }) : NotificationTemplatePayload {
  const title = "Order in preparation";
  const message = `Your order ${params.orderId} is now being prepared.`;
  const emailHtml = `<p>${message}</p>`;
  const smsText = `Order ${params.orderId} is being prepared.`;

  return { title, message, emailHtml, smsText };
}
