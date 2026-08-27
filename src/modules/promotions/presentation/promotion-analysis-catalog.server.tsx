import { Alert } from "antd";

import { ApiError } from "@/shared/api/api-error";

import type { PromotionAudience } from "../domain/promotion-analysis.model";
import type { PromotionAnalysisPage } from "../domain/promotion-analysis.model";
import { createPromotionsRepository } from "../promotions.composition.server";
import { PromotionAnalysisTable } from "./promotion-analysis-table.client";

type Props = Readonly<{ params: Record<string, string | string[] | undefined> }>;

export async function PromotionAnalysisCatalog({ params }: Props) {
  const promotionId = first(params.promotionId)?.trim();
  if (!promotionId) return <Alert type="info" showIcon message="Seleccioná una promoción para analizar publicaciones." />;
  let page: PromotionAnalysisPage;
  try {
    page = await createPromotionsRepository().getPromotionAnalysis({
      promotionId, audience: readAudience(first(params.audience)), limit: 20, cursor: first(params.cursor) ?? null,
    });
  } catch (error) {
    const message = error instanceof ApiError && error.code === "API_TIMEOUT"
      ? "Mercado Libre tardó demasiado en responder. Volvé a intentar."
      : "No se pudo analizar la promoción de Mercado Libre.";
    return <Alert type="error" showIcon message={message} />;
  }
  return <PromotionAnalysisTable page={page} />;
}

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function readAudience(value: string | undefined): PromotionAudience | undefined {
  return value === "WOMEN" || value === "GIRLS" ? value : undefined;
}
