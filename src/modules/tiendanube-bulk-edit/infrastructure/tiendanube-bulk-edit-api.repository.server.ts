import "server-only";

import { z } from "zod";
import { ApiError } from "@/shared/api/api-error";
import type { AuthenticatedHttpClient } from "@/shared/api/authenticated-http-client.server";
import type { TiendanubeBulkEditRepository } from "../domain/tiendanube-bulk-edit.repository";
import type { TiendanubeBulkEditCategorySummary, TiendanubeBulkEditJob, TiendanubeBulkEditPreview, TiendanubeBulkEditRequest } from "../domain/tiendanube-bulk-edit.model";
import { activeJobSchema, categorySummarySchema, previewSchema } from "./tiendanube-bulk-edit.schema";

const basePath = "/tiendanube/bulk-edition";

export class TiendanubeBulkEditApiRepository implements TiendanubeBulkEditRepository {
  constructor(private readonly httpClient: AuthenticatedHttpClient) {}

  async getCategorySummary(categoryId: number): Promise<TiendanubeBulkEditCategorySummary> {
    return this.parse(categorySummarySchema, await this.httpClient.get(`${basePath}/categories/${categoryId}/summary`), "el resumen de la categoría");
  }

  async preview(request: TiendanubeBulkEditRequest): Promise<TiendanubeBulkEditPreview> {
    return this.parse(previewSchema, await this.httpClient.post(`${basePath}/preview`, request), "la previsualización");
  }

  async getActive(): Promise<TiendanubeBulkEditJob | null> {
    const parsed = activeJobSchema.safeParse(await this.httpClient.get(`${basePath}/jobs/active`));
    return parsed.success ? parsed.data : null;
  }

  private parse<T>(schema: z.ZodType<T>, value: unknown, resource: string): T {
    const parsed = schema.safeParse(value);
    if (parsed.success) return parsed.data;
    throw new ApiError(`El backend devolvió ${resource} inválidos.`, "API_INVALID_RESPONSE", { cause: parsed.error });
  }
}
