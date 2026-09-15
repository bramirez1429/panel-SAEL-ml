import "server-only";

import type { AuthenticatedHttpClient } from "@/shared/api/authenticated-http-client.server";
import { ApiError } from "@/shared/api/api-error";

import type {
  RecentSalesResponse,
  SalesSyncResult,
  SaleVariantsResponse,
} from "../domain/sales.model";

import {
  recentSalesResponseSchema,
  salesSyncResponseSchema,
  saleVariantsResponseSchema,
} from "./sales.schema";

const SALES_TIMEOUT_MS = 60_000;

export class SalesApiRepository {
  constructor(private readonly http: AuthenticatedHttpClient) {}

  async getRecent(hours = 48): Promise<RecentSalesResponse> {
    const response = await this.http.get(
      "/sales/recent?hours=" + encodeURIComponent(String(hours)),
      { timeoutMs: SALES_TIMEOUT_MS },
    );

    const parsed = recentSalesResponseSchema.safeParse(response);

    if (!parsed.success) {
      throw new ApiError(
        "Respuesta de ventas recientes inválida.",
        "API_INVALID_RESPONSE",
        { cause: parsed.error },
      );
    }

    return parsed.data;
  }

  async sync(hours = 48): Promise<SalesSyncResult> {
    const response = await this.http.post(
      "/sales/sync?hours=" + encodeURIComponent(String(hours)),
      undefined,
      { timeoutMs: SALES_TIMEOUT_MS },
    );

    const parsed = salesSyncResponseSchema.safeParse(response);

    if (!parsed.success) {
      throw new ApiError(
        "Respuesta de sincronización de ventas inválida.",
        "API_INVALID_RESPONSE",
        { cause: parsed.error },
      );
    }

    return parsed.data;
  }

  async getVariants(saleId: string): Promise<SaleVariantsResponse> {
    const response = await this.http.get(
      "/sales/recent/" + encodeURIComponent(saleId) + "/variants",
      { timeoutMs: SALES_TIMEOUT_MS },
    );

    const parsed = saleVariantsResponseSchema.safeParse(response);

    if (!parsed.success) {
      throw new ApiError(
        "Respuesta de variantes de venta inválida.",
        "API_INVALID_RESPONSE",
        { cause: parsed.error },
      );
    }

    return parsed.data;
  }
}

