"use server";

import { unstable_rethrow } from "next/navigation";
import { orderKeySchema } from "./sales-operations.model";
import { salesOperationsClient } from "./sales-operations.server";
import { z } from "zod";

export async function completeSaleAction(value: unknown) {
  const parsed = orderKeySchema.extend({ completed: z.boolean() }).safeParse(value);
  if (!parsed.success) return { ok: false } as const;
  try {
    await salesOperationsClient().post("/sales/operations/complete", parsed.data);
    return { ok: true } as const;
  } catch (error) { unstable_rethrow(error); return { ok: false } as const; }
}
export async function readSaleAction(value: unknown) {
  const parsed = orderKeySchema.safeParse(value);
  if (!parsed.success) return { ok: false } as const;
  try {
    await salesOperationsClient().post("/sales/operations/read", parsed.data);
    return { ok: true } as const;
  } catch (error) { unstable_rethrow(error); return { ok: false } as const; }
}

const syncResultSchema = z.object({
  mercadoLibre: z.object({
    found: z.number().int().nonnegative(),
    processed: z.number().int().nonnegative(),
    failed: z.number().int().nonnegative(),
  }),
});

export async function syncMercadoLibreSalesAction() {
  try {
    const result = syncResultSchema.parse(
      await salesOperationsClient().post("/sales/sync?hours=48", undefined, { timeoutMs: 60000 }),
    );
    return { ok: true, ...result.mercadoLibre } as const;
  } catch (error) {
    unstable_rethrow(error);
    return { ok: false } as const;
  }
}
