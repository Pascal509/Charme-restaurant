import { z } from "zod";

const optionalString = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.string().min(1).optional()
);

export const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  NEXTAUTH_SECRET: z.string().min(1),
  NEXTAUTH_URL: z.string().url(),
  CATALOG_READ_SOURCE: z.enum(["static", "prisma"]).default("static"),
  GOOGLE_CLIENT_ID: optionalString,
  GOOGLE_CLIENT_SECRET: optionalString,
  STRIPE_SECRET_KEY: optionalString,
  STRIPE_WEBHOOK_SECRET: optionalString,
  STRIPE_SUCCESS_URL: z.preprocess(
    (value) => (value === "" ? undefined : value),
    z.string().url().optional()
  ),
  STRIPE_CANCEL_URL: z.preprocess(
    (value) => (value === "" ? undefined : value),
    z.string().url().optional()
  ),
  FLUTTERWAVE_PUBLIC_KEY: z.string().min(1),
  FLUTTERWAVE_SECRET_KEY: z.string().min(1),
  FLUTTERWAVE_WEBHOOK_SECRET: z.string().min(1),
  FLUTTERWAVE_REDIRECT_URL: z.string().url(),
  REDIS_URL: z.string().min(1),
  BASE_CURRENCY: z.string().min(3),
  FX_RATE_TTL_SECONDS: z.coerce.number().int().min(60),
  FX_SPREAD_BPS: z.coerce.number().int().min(0).max(500)
});
