import type { SalesRepository } from "../domain/sales.repository";

export function getSaleVariants(
  repository: SalesRepository,
  saleId: string,
) {
  return repository.getVariants(saleId);
}

