import { redirect } from "next/navigation";
import { Suspense } from "react";

import type { PromotionAudience } from "../domain/promotion-analysis.model";
import type { PromotionCampaigns } from "../domain/promotion-campaign.model";
import { createPromotionsRepository } from "../promotions.composition.server";
import { PromotionAnalysisCatalog } from "./promotion-analysis-catalog.server";
import { PromotionCampaignsError } from "./promotion-campaigns-error";
import { PromotionCampaignsSkeleton } from "./promotion-campaigns-skeleton";
import { PromotionsView } from "./promotions-view";

type SearchParams = Record<string, string | string[] | undefined>;
type Props = Readonly<{ searchParams: Promise<SearchParams> }>;

export async function PromotionCampaignsSection({ searchParams }: Props) {
  const params = await searchParams;
  const audience = readAudience(first(params.audience));
  let campaigns: PromotionCampaigns | null = null;
  try {
    campaigns = await createPromotionsRepository().getCampaigns();
  } catch {}
  if (!campaigns) return <PromotionCampaignsError />;

  const promotionId = first(params.promotionId);
  if (promotionId && !campaigns.campaigns.some((campaign) => campaign.id === promotionId)) {
    const next = new URLSearchParams();
    if (audience) next.set("audience", audience);
    redirect(`/promociones?${next}`);
  }

  return <PromotionsView campaigns={campaigns.campaigns}>
    <Suspense fallback={<PromotionCampaignsSkeleton />}>
      <PromotionAnalysisCatalog params={params} />
    </Suspense>
  </PromotionsView>;
}

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function readAudience(value: string | undefined): PromotionAudience | undefined {
  return value === "WOMEN" || value === "GIRLS" ? value : undefined;
}
