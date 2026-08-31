import { Alert } from "antd";
import { ApiError } from "@/shared/api/api-error";
import { createPromotionsRepository } from "../promotions.composition.server";
import { parsePublicationSearch } from "../domain/publication-search.parser";
import { PublicationSearchBar } from "./publication-search-bar.client";
import { PromotionsCatalogClient } from "./promotions-catalog.client";
import type { PromotionsPage } from "../domain/promotion.model";
type Props = Readonly<{
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}>;
const first = (value: string | string[] | undefined) => Array.isArray(value) ? value[0] : value;
const productGroups = ["WOMEN_TSHIRT", "WOMEN_SWEATSHIRT", "GIRLS_TSHIRT", "GIRLS_SWEATSHIRT"] as const;
const statuses = ["ACTIVE", "AVAILABLE", "PENDING", "NONE"] as const;
function oneOf<T extends string>(value: string | undefined, allowed: readonly T[]): T | undefined { return value && (allowed as readonly string[]).includes(value) ? value as T : undefined; }
export async function PromotionsCatalog({ searchParams }: Props) {
  const params = await searchParams;
  const criteria = parsePublicationSearch(first(params.search) ?? "");
  const search = criteria?.value ?? "";
  let page: PromotionsPage;
  try {
    page = await createPromotionsRepository().getCatalog({ limit: 20, cursor: first(params.cursor) ?? null, ...(search ? { search } : {}), productGroup: oneOf(first(params.productGroup), productGroups), promotionStatus: oneOf(first(params.promotionStatus), statuses), promotionType: first(params.promotionType) });
  } catch (error) {
    const message = error instanceof ApiError && error.code === "API_TIMEOUT" ? "Mercado Libre tardó demasiado en responder. Volvé a intentar." : "No se pudieron cargar las promociones de Mercado Libre.";
    return <><PublicationSearchBar key={search} initialSearch={search} /><Alert type="error" showIcon message={message} /></>;
  }
  return <><PublicationSearchBar key={search} initialSearch={search} /><PromotionsCatalogClient page={page} activeSearch={search} /></>;
}
