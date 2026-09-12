import type { PromotionsPage } from "../domain/promotion.model";
import type { PromotionsRepository, PromotionsRequest } from "../domain/promotions.repository";

type FamilySearchRequest = Omit<PromotionsRequest, "search">;

/** Fuente global de familias ya utilizada por el catálogo de Promociones. */
export function searchPublicationsByFamily(
  repository: Pick<PromotionsRepository, "getCatalog">,
  familyId: string,
  request: FamilySearchRequest,
): Promise<PromotionsPage> {
  return repository.getCatalog({ ...request, search: familyId });
}
