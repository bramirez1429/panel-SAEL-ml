"use server";

import type { SalesSyncResult } from "../domain/sales.model";
import { syncRecentSales } from "../application/sync-recent-sales";
import { createSalesRepository } from "../sales.composition.server";

export async function syncSalesAction(
  hours = 48,
): Promise<SalesSyncResult> {
  const result = await syncRecentSales(
    createSalesRepository(),
    hours,
  );

  console.log("[SALES SYNC]", JSON.stringify(result, null, 2));

  return result;
}
