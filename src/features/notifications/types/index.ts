export type NotificationChannel = "EMAIL" | "SMS" | "PUSH";

export type NotificationType =
  | "ORDER_CONFIRMED"
  | "ORDER_PREPARING"
  | "ORDER_READY"
  | "ORDER_OUT_FOR_DELIVERY"
  | "ORDER_DELIVERED"
  | "PAYMENT_FAILED";

export type NotificationTemplatePayload = {
  title: string;
  message: string;
  emailHtml: string;
  smsText: string;
};

export type NotificationJob = {
  eventId: string;
  userId: string;
  orderId?: string | null;
  type: NotificationType;
  channel: NotificationChannel;
  payload: NotificationTemplatePayload;
  recipient?: string | null;
  skipReason?: string | null;
};
