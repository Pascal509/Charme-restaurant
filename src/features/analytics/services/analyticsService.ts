import { log } from "@/lib/logger";

export async function recordOrderAnalytics(payload: Record<string, unknown>) {
  log("info", "Record order analytics", payload);
}
