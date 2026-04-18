import { z } from "zod";

export const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  NEXTAUTH_SECRET: z.string().min(1),
  NEXTAUTH_URL: z.string().url(),
  GOOGLE_CLIENT_ID: z.string().min(1),
  GOOGLE_CLIENT_SECRET: z.string().min(1),
  STRIPE_SECRET_KEY: z.string().min(1),
  STRIPE_WEBHOOK_SECRET: z.string().min(1),
  STRIPE_SUCCESS_URL: z.string().url(),
  STRIPE_CANCEL_URL: z.string().url(),
  FLUTTERWAVE_PUBLIC_KEY: z.string().min(1),
  FLUTTERWAVE_SECRET_KEY: z.string().min(1),
  FLUTTERWAVE_WEBHOOK_SECRET: z.string().min(1),
  FLUTTERWAVE_REDIRECT_URL: z.string().url(),
  REDIS_URL: z.string().min(1),
  BASE_CURRENCY: z.string().min(3),
  FX_RATE_TTL_SECONDS: z.coerce.number().int().min(60),
  FX_SPREAD_BPS: z.coerce.number().int().min(0).max(500)
});
