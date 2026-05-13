type LogLevel = "debug" | "info" | "warn" | "error";

const isProd = process.env.NODE_ENV === "production";

export function log(level: LogLevel, message: string, meta?: Record<string, unknown>) {
  // Suppress all logging in production for clean demo experience
  if (isProd) {
    return;
  }

  console[level](`[${level.toUpperCase()}] ${message}`, meta ?? "");
}
