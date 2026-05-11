import { envSchema } from "@/lib/validation/env";
import type { z } from "zod";

export type Env = z.infer<typeof envSchema>;

const shouldSkip = process.env.SKIP_ENV_VALIDATION === "1" && process.env.NODE_ENV !== "production";

export const env: Env = shouldSkip
	? (process.env as unknown as Env)
	: envSchema.parse(process.env);
