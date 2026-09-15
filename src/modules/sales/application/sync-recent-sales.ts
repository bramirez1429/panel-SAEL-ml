import type { SalesSyncResult } from "../domain/sales.model";
import type { SalesRepository } from "../domain/sales.repository";

export function syncRecentSales(
  repository: SalesRepository,
  hours = 48,
): Promise<SalesSyncResult> {
  return repository.sync(hours);
}
