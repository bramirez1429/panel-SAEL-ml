import { PageHeader } from "@/shared/ui/page-header/page-header";
import { createPromotionsRepository } from "@/modules/promotions/promotions.composition.server";
import { PromotionsView } from "@/modules/promotions/presentation/promotions-view";
import type { PromotionFacets, PromotionsPage } from "@/modules/promotions/domain/promotion.model";
export const dynamic = "force-dynamic";
type Props = Readonly<{ searchParams: Promise<Record<string, string | string[] | undefined>> }>;
const emptyPage: PromotionsPage = { publications: [], done: true, nextCursor: null, count: 0 };
const emptyFacets: PromotionFacets = { categories: [], attributes: [] };
export default async function PromotionsPage({ searchParams }: Props) {
  const params = await searchParams; const first = (value: string | string[] | undefined) => Array.isArray(value) ? value[0] : value; const repo = createPromotionsRepository();
  const [catalog, facets] = await Promise.all([repo.getCatalog({ limit: 20, cursor: first(params.cursor) ?? null, search: first(params.search), categoryId: first(params.categoryId), promotionStatus: first(params.promotionStatus), promotionType: first(params.promotionType), facetFilters: first(params.facetFilters) }).then((page) => ({ page, error: false })).catch(() => ({ page: emptyPage, error: true })), repo.getFacets().then((value) => ({ value, error: false })).catch(() => ({ value: emptyFacets, error: true }))]);
  return <><PageHeader description="Gestioná las promociones de tus publicaciones de Mercado Libre." /><PromotionsView facets={facets.value} page={catalog.page} catalogError={catalog.error} facetsError={facets.error} /></>;
}
