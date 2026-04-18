import { z } from "zod";

export const paginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20)
});

export const idParamSchema = z.object({
  id: z.string().min(1)
});

export const localeParamsSchema = z.object({
  locale: z.string().min(2),
  country: z.string().min(2)
});
