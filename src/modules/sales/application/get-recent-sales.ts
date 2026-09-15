import type { SalesRepository } from "../domain/sales.repository";

export function getRecentSales(
  repository: SalesRepository,
  hours = 48,
) {
  return repository.getRecent(hours);
}

