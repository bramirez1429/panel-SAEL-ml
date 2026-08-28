import { Suspense } from "react";
import { redirect } from "next/navigation";

import type { PromotionAudience } from "@/modules/promotions/domain/promotion-analysis.model";
import type { PromotionCampaigns } from "@/modules/promotions/domain/promotion-campaign.model";
import { PromotionAnalysisCatalog } from "@/modules/promotions/presentation/promotion-analysis-catalog.server";
import { PromotionsView } from "@/modules/promotions/presentation/promotions-view";
import { createPromotionsRepository } from "@/modules/promotions/promotions.composition.server";
import { PageHeader } from "@/shared/ui/page-header/page-header";

export const dynamic = "force-dynamic";

type Props = Readonly<{ searchParams: Promise<Record<string, string | string[] | undefined>> }>;

export default async function PromotionsPage({ searchParams }: Props) {
  const params = await searchParams;
  const audience = readAudience(first(params.audience));
  const campaigns = await campaignsFor(audience);
  const promotionId = first(params.promotionId);
  if (campaigns && promotionId && !campaigns.campaigns.some((campaign) => campaign.id === promotionId)) {
    const next = new URLSearchParams();
    if (audience) next.set("audience", audience);
    redirect(`/promociones?${next}`);
  }
  return <>
    <PageHeader description="Analizá promociones de tus publicaciones de Mercado Libre." />
    <PromotionsView campaigns={campaigns?.campaigns ?? []}>
      <Suspense fallback={<p aria-live="polite">Cargando análisis de promociones…</p>}>
        <PromotionAnalysisCatalog params={params} />
      </Suspense>
    </PromotionsView>
  </>;
}

async function campaignsFor(audience: PromotionAudience | undefined): Promise<PromotionCampaigns | null> {
  try {
    return await createPromotionsRepository().getCampaigns(audience);
  } catch {
    return null;
  }
}

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function readAudience(value: string | undefined): PromotionAudience | undefined {
  return value === "WOMEN" || value === "GIRLS" ? value : undefined;
}
