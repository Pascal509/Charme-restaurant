type LogLevel = "debug" | "info" | "warn" | "error";

const isProd = process.env.NODE_ENV === "production";

export function log(level: LogLevel, message: string, meta?: Record<string, unknown>) {
  const payload = meta ? { message, ...meta } : { message };
  if (isProd) {
    console[level](payload);
    return;
  }
  console[level](`[${level.toUpperCase()}] ${message}`, meta ?? "");
}
