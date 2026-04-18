import { z } from "zod";

export function validateOrThrow<T extends z.ZodTypeAny>(schema: T, payload: unknown) {
  const result = schema.safeParse(payload);
  if (!result.success) {
    throw result.error;
  }
  return result.data as z.infer<T>;
}
