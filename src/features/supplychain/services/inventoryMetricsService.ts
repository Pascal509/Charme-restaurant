import { log } from "@/lib/logger";

export async function updateInventoryMetrics(payload: Record<string, unknown>) {
  log("info", "Update inventory metrics", payload);
}
