import { Suspense } from "react";

import { PromotionCampaignsSection } from "@/modules/promotions/presentation/promotion-campaigns-section.server";
import { PromotionCampaignsSkeleton } from "@/modules/promotions/presentation/promotion-campaigns-skeleton";
import { PageHeader } from "@/shared/ui/page-header/page-header";

export const dynamic = "force-dynamic";

type Props = Readonly<{ searchParams: Promise<Record<string, string | string[] | undefined>> }>;

export default function PromotionsPage({ searchParams }: Props) {
  return <>
    <PageHeader description="Analizá promociones de tus publicaciones de Mercado Libre." />
    <Suspense fallback={<PromotionCampaignsSkeleton />}>
      <PromotionCampaignsSection searchParams={searchParams} />
    </Suspense>
  </>;
}
