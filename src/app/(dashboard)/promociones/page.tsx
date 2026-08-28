import { Suspense } from "react";

import { PromotionCampaignsSection } from "@/modules/promotions/presentation/promotion-campaigns-section.server";
import { PromotionCampaignsSkeleton } from "@/modules/promotions/presentation/promotion-campaigns-skeleton";
import { PageHeader } from "@/shared/ui/page-header/page-header";

export const dynamic = "force-dynamic";

export default function PromotionsPage() {
  return <>
    <PageHeader description="Promociones de tus publicaciones de Mercado Libre." />
    <Suspense fallback={<PromotionCampaignsSkeleton />}>
      <PromotionCampaignsSection />
    </Suspense>
  </>;
}
