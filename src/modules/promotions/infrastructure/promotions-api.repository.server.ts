import "server-only";

import type { AuthenticatedHttpClient } from "@/shared/api/authenticated-http-client.server";
import { ApiError } from "@/shared/api/api-error";

import type {
  PromotionApplyRequest,
  PromotionAnalysisRequest,
  PromotionOption,
  PromotionsRepository,
  PromotionsRequest,
} from "../domain/promotions.repository";
import { mapPromotionAnalysis } from "../domain/promotion-analysis.mapper";
import { promotionAnalysisResponseSchema } from "./promotion-analysis.schema";
import {
  catalogSchema,
  optionsSchema,
  publicationPreviewSchema,
  publicationResultSchema,
} from "./promotions.schema";

const PREVIEW_TIMEOUT_MS = 30_000;
const WRITE_TIMEOUT_MS = 120_000;

export class PromotionsApiRepository implements PromotionsRepository {
  constructor(private readonly http: AuthenticatedHttpClient) {}

  async getCatalog(request: PromotionsRequest) {
    const params = catalogParams(request);
    const response = await this.http.get(
      `/mercadolibre/direct/promociones?${params}`,
    );
    const parsed = catalogSchema.safeParse(response);
    if (!parsed.success) {
      throw invalidResponse("Catálogo de promociones inválido.", parsed.error);
    }
    return parsed.data;
  }

  async analyze(request: PromotionAnalysisRequest) {
    const response = await this.http.get(
      `/mercadolibre/direct/promociones/analisis?${analysisParams(request)}`,
      { timeoutMs: PREVIEW_TIMEOUT_MS },
    );
    const parsed = promotionAnalysisResponseSchema.safeParse(response);
    if (!parsed.success) {
      throw invalidResponse("Análisis de promociones inválido.", parsed.error);
    }
    return mapPromotionAnalysis(parsed.data);
  }

  async getOptions(itemId: string): Promise<readonly PromotionOption[]> {
    const response = await this.http.get(
      `/mercadolibre/direct/promociones/${encodeURIComponent(itemId)}/opciones`,
      { timeoutMs: PREVIEW_TIMEOUT_MS },
    );
    const parsed = optionsSchema.safeParse(response);
    if (!parsed.success) {
      throw invalidResponse("Opciones de promoción inválidas.", parsed.error);
    }
    return parsed.data;
  }

  async preview(sourceKey: string, request: PromotionApplyRequest) {
    const params = applyRequestParams(request);
    const response = await this.http.get(
      `${publicationPath(sourceKey)}/preview?${params}`,
      { timeoutMs: PREVIEW_TIMEOUT_MS },
    );
    const parsed = publicationPreviewSchema.safeParse(response);
    if (!parsed.success) {
      throw invalidResponse("Preview de promoción inválido.", parsed.error);
    }
    return parsed.data;
  }

  async remove(sourceKey: string) {
    const response = await this.http.delete(publicationPath(sourceKey), {
      timeoutMs: WRITE_TIMEOUT_MS,
    });
    const parsed = publicationResultSchema.safeParse(response);
    if (!parsed.success) {
      throw invalidResponse("Resultado de promoción inválido.", parsed.error);
    }
    return parsed.data;
  }

  async apply(sourceKey: string, request: PromotionApplyRequest) {
    const response = await this.http.post(
      `${publicationPath(sourceKey)}/aplicar`,
      request,
      { timeoutMs: WRITE_TIMEOUT_MS },
    );
    const parsed = publicationResultSchema.safeParse(response);
    if (!parsed.success) {
      throw invalidResponse("Resultado de promoción inválido.", parsed.error);
    }
    return parsed.data;
  }
}

function publicationPath(sourceKey: string): string {
  return `/mercadolibre/direct/promociones/publicacion/${encodeURIComponent(sourceKey)}`;
}

function applyRequestParams(request: PromotionApplyRequest): URLSearchParams {
  const params = new URLSearchParams({ type: request.type });
  if (request.type === "PRICE_DISCOUNT") {
    params.set("dealPrice", String(request.dealPrice));
    params.set("startDate", request.startDate);
    params.set("finishDate", request.finishDate);
  } else if (request.type === "SMART") {
    params.set("promotionId", request.promotionId);
    params.set("offerId", request.offerId);
  } else {
    params.set("promotionId", request.promotionId);
    params.set("dealPrice", String(request.dealPrice));
  }
  return params;
}

function catalogParams(request: PromotionsRequest): URLSearchParams {
  const params = new URLSearchParams({ limit: String(request.limit) });
  if (request.cursor) params.set("cursor", request.cursor);
  if (request.search?.trim()) params.set("search", request.search.trim());
  if (request.productGroup) params.set("productGroup", request.productGroup);
  if (request.promotionStatus)
    params.set("promotionStatus", request.promotionStatus);
  if (request.promotionType) params.set("promotionType", request.promotionType);
  return params;
}

function analysisParams(request: PromotionAnalysisRequest): URLSearchParams {
  const params = new URLSearchParams({
    promotionId: request.promotionId,
    limit: String(request.limit),
  });
  if (request.cursor) params.set("cursor", request.cursor);
  if (request.audience) params.set("audience", request.audience);
  return params;
}

function invalidResponse(message: string, cause: unknown): ApiError {
  return new ApiError(message, "API_INVALID_RESPONSE", { cause });
}
