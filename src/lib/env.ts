import { envSchema } from "@/lib/validation/env";

export const env = envSchema.parse(process.env);
