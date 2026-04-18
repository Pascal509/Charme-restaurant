import { log } from "@/lib/logger";

export async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
}) {
  log("info", "Send email notification", {
    to: params.to,
    subject: params.subject
  });

  return { providerId: "email-stub" };
}
