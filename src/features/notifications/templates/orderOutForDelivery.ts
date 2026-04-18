import type { NotificationTemplatePayload } from "@/features/notifications/types";

export function orderOutForDeliveryTemplate(params: { orderId: string }) : NotificationTemplatePayload {
  const title = "Order out for delivery";
  const message = `Your order ${params.orderId} is out for delivery.`;
  const emailHtml = `<p>${message}</p>`;
  const smsText = `Order ${params.orderId} is out for delivery.`;

  return { title, message, emailHtml, smsText };
}
