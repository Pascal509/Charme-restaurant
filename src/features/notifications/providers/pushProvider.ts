import { log } from "@/lib/logger";

export async function sendPush(params: {
  to: string;
  title: string;
  message: string;
}) {
  log("info", "Send push notification", {
    to: params.to,
    title: params.title
  });

  return { providerId: "push-stub" };
}
