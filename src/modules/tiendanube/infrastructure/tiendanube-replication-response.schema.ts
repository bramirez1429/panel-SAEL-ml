import { z } from "zod";

const statusSchema = z.enum(["NOT_REPLICATED", "PENDING", "FAILED", "COMPLETED"]);

export const statusResponseSchema = z.object({
  items: z.array(z.object({
    sourceKey: z.string().min(1),
    status: statusSchema,
    tiendanubeProductId: z.string().nullable().optional(),
  })),
});

export const replicationResponseSchema = z.object({
  ok: z.literal(true),
  action: z.enum(["created", "updated"]),
  mercadolibreSourceId: z.string().uuid(),
  tiendanubeProductId: z.string().min(1),
}).strict();
