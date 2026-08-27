import { Suspense } from "react";
import { PageHeader } from "@/shared/ui/page-header/page-header";
import { PromotionsView } from "@/modules/promotions/presentation/promotions-view";
import { PromotionsCatalog } from "@/modules/promotions/presentation/promotions-catalog.server";
export const dynamic = "force-dynamic";
type Props = Readonly<{ searchParams: Promise<Record<string, string | string[] | undefined>> }>;
export default async function PromotionsPage({ searchParams }: Props) {
  const params = await searchParams;
  return <><PageHeader description="Gestioná las promociones de tus publicaciones de Mercado Libre." /><PromotionsView><Suspense fallback={<p aria-live="polite">Cargando promociones…</p>}><PromotionsCatalog params={params} mode="Masivo" selected={[]} /></Suspense></PromotionsView></>;
}
