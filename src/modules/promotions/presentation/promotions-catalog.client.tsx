"use client";

import { Button } from "antd";
import { useRouter, useSearchParams } from "next/navigation";

import type { PromotionsPage } from "../domain/promotion.model";
import { PromotionSelectionSummary } from "./promotion-selection-summary.client";
import { PromotionsTable } from "./promotions-table.client";

type Props = Readonly<{ page: PromotionsPage }>;

export function PromotionsCatalogClient({ page }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const nextPage = () => {
    if (!page.nextCursor) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("cursor", page.nextCursor);
    router.push(`/promociones?${params.toString()}`);
  };

  return <div className="promotions-layout">
    <PromotionSelectionSummary />
    {page.publications.length > 0
      ? <PromotionsTable page={page} />
      : <p>No se encontraron publicaciones.</p>}
    {!page.done && page.nextCursor
      ? <Button onClick={nextPage} style={{ marginTop: 16 }}>Siguiente</Button>
      : null}
  </div>;
}
