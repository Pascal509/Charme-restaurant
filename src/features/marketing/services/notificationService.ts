import { log } from "@/lib/logger";

export async function sendOrderConfirmationEmail(payload: Record<string, unknown>) {
  log("info", "Send order confirmation email", payload);
}

export async function sendPaymentFailedNotification(payload: Record<string, unknown>) {
  log("info", "Send payment failed notification", payload);
}
