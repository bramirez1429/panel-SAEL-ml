import { Suspense } from "react";

import { PromotionAnalysisCatalog } from "@/modules/promotions/presentation/promotion-analysis-catalog.server";
import { PromotionsView } from "@/modules/promotions/presentation/promotions-view";
import { PageHeader } from "@/shared/ui/page-header/page-header";

export const dynamic = "force-dynamic";

type Props = Readonly<{ searchParams: Promise<Record<string, string | string[] | undefined>> }>;

export default async function PromotionsPage({ searchParams }: Props) {
  const params = await searchParams;
  return <>
    <PageHeader description="Analizá promociones de tus publicaciones de Mercado Libre." />
    <PromotionsView>
      <Suspense fallback={<p aria-live="polite">Cargando análisis de promociones…</p>}>
        <PromotionAnalysisCatalog params={params} />
      </Suspense>
    </PromotionsView>
  </>;
}
