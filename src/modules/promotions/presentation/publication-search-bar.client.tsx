"use client";

import { MercadoLibrePublicationSearch } from "@/shared/ui/mercadolibre-publication-search.client";
import { resetPromotionCursorHistory } from "./promotions-cursor-history.client";

type Props = Readonly<{ initialSearch: string }>;

/** Mantiene el contrato histórico de Promociones sobre el buscador compartido. */
export function PublicationSearchBar({ initialSearch }: Props) {
  return <MercadoLibrePublicationSearch
    initialSearch={initialSearch}
    pathname="/promociones"
    onResetCursorHistory={resetPromotionCursorHistory}
  />;
}
