import { PageHeader } from "@/shared/ui/page-header/page-header";
import { createPromotionsRepository } from "@/modules/promotions/promotions.composition.server";
import { PromotionsView } from "@/modules/promotions/presentation/promotions-view";
import type { PromotionFacets, PromotionsPage } from "@/modules/promotions/domain/promotion.model";
export const dynamic = "force-dynamic";
type Props = Readonly<{ searchParams: Promise<Record<string, string | string[] | undefined>> }>;
type LoadResult = Readonly<{ facets: PromotionFacets; page: PromotionsPage }> | null;
async function load(params: Record<string, string | string[] | undefined>): Promise<LoadResult> {
  const first = (value: string | string[] | undefined) => Array.isArray(value) ? value[0] : value;
  try { const repo = createPromotionsRepository(); return await Promise.all([repo.getFacets(), repo.getCatalog({ limit: 20, cursor: first(params.cursor) ?? null, search: first(params.search), categoryId: first(params.categoryId), promotionStatus: first(params.promotionStatus), promotionType: first(params.promotionType), facetFilters: first(params.facetFilters) })]).then(([facets, page]) => ({ facets, page })); } catch { return null; }
}
export default async function PromotionsPage({ searchParams }: Props) {
  const result = await load(await searchParams);
  return <><PageHeader description="Gestioná las promociones de tus publicaciones de Mercado Libre." />{result ? <PromotionsView facets={result.facets} page={result.page} /> : <p role="alert">No se pudieron cargar las promociones.</p>}</>;
}
