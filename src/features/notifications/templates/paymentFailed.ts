import type { NotificationTemplatePayload } from "@/features/notifications/types";

export function paymentFailedTemplate(params: { orderId: string }) : NotificationTemplatePayload {
  const title = "Payment failed";
  const message = `Payment for order ${params.orderId} failed. Please retry.`;
  const emailHtml = `<p>${message}</p>`;
  const smsText = `Payment for order ${params.orderId} failed.`;

  return { title, message, emailHtml, smsText };
}
