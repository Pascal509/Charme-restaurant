import { z } from "zod";

const optionalString = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.string().min(1).optional()
);

export const envSchema = z
  .object({
    DATABASE_URL: z.preprocess(
      (value) => (value === "" ? undefined : value),
      z.string().url().optional()
    ),
  NEXTAUTH_SECRET: z.string().min(1),
  NEXTAUTH_URL: z.string().url(),
  CATALOG_READ_SOURCE: z.enum(["static", "prisma"]).default("static"),
  GOOGLE_CLIENT_ID: optionalString,
  GOOGLE_CLIENT_SECRET: optionalString,
  DEFAULT_PAYMENT_PROVIDER: z.enum(["FLUTTERWAVE", "PAYSTACK"]).default("FLUTTERWAVE"),
  PAYSTACK_PUBLIC_KEY: optionalString,
  PAYSTACK_SECRET_KEY: optionalString,
  PAYSTACK_REDIRECT_URL: z.preprocess(
    (value) => (value === "" ? undefined : value),
    z.string().url().optional()
  ),
  FLUTTERWAVE_PUBLIC_KEY: z.string().min(1),
  FLUTTERWAVE_SECRET_KEY: z.string().min(1),
  FLUTTERWAVE_WEBHOOK_SECRET: z.string().min(1),
  FLUTTERWAVE_REDIRECT_URL: z.string().url(),
  REDIS_ENABLED: z.preprocess(
    (value) => {
      if (value === "" || value === undefined) return "0";
      return value;
    },
    z
      .enum(["0", "1"])
      .transform((value) => value === "1")
  ),
  REDIS_URL: z.preprocess(
    (value) => (value === "" ? undefined : value),
    z.string().min(1).optional()
  ),
  BASE_CURRENCY: z.string().min(3),
  FX_RATE_TTL_SECONDS: z.coerce.number().int().min(60),
  FX_SPREAD_BPS: z.coerce.number().int().min(0).max(500)
  })
  .superRefine((env, ctx) => {
    if (env.CATALOG_READ_SOURCE === "prisma" && !env.DATABASE_URL) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["DATABASE_URL"],
        message: "DATABASE_URL is required when CATALOG_READ_SOURCE=prisma"
      });
    }

    if (env.REDIS_ENABLED && !env.REDIS_URL) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["REDIS_URL"],
        message: "REDIS_URL is required when REDIS_ENABLED=1"
      });
    }
  });
