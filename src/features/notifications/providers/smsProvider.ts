import { log } from "@/lib/logger";

export async function sendSms(params: { to: string; message: string }) {
  log("info", "Send SMS notification", {
    to: params.to
  });

  return { providerId: "sms-stub" };
}
