import { z } from "zod";

export const mercadolibreSyncProgressSchema = z.object({
  ok: z.literal(true),
  syncId: z.string().min(1),
  status: z.enum(["PENDING", "RUNNING", "COMPLETED", "FAILED"]),
  totalItems: z.number().int().nonnegative(),
  processedItems: z.number().int().nonnegative(),
  productsSaved: z.number().int().nonnegative(),
  childrenSaved: z.number().int().nonnegative(),
  errorsCount: z.number().int().nonnegative(),
  lastError: z.string().nullable(),
  hasMore: z.boolean(),
});
