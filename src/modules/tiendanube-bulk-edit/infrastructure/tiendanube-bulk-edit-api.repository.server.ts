import "server-only";

import { z } from "zod";
import { ApiError } from "@/shared/api/api-error";
import type { AuthenticatedHttpClient } from "@/shared/api/authenticated-http-client.server";
import type { TiendanubeBulkEditRepository } from "../domain/tiendanube-bulk-edit.repository";
import type { TiendanubeBulkEditCategorySummary, TiendanubeBulkEditFailuresPage, TiendanubeBulkEditJob, TiendanubeBulkEditPreview, TiendanubeBulkEditRequest } from "../domain/tiendanube-bulk-edit.model";
import { activeJobSchema, categorySummarySchema, failuresPageSchema, jobSchema, previewSchema } from "./tiendanube-bulk-edit.schema";

const basePath = "/tiendanube/bulk-edition";

export class TiendanubeBulkEditApiRepository implements TiendanubeBulkEditRepository {
  constructor(private readonly httpClient: AuthenticatedHttpClient) {}

  async getCategorySummary(categoryId: number): Promise<TiendanubeBulkEditCategorySummary> {
    return this.parse(categorySummarySchema, await this.httpClient.get(`${basePath}/categories/${categoryId}`), "el resumen de la categoría");
  }

  async preview(request: TiendanubeBulkEditRequest): Promise<TiendanubeBulkEditPreview> {
    return this.parse(previewSchema, await this.httpClient.post(`${basePath}/preview`, request), "la previsualización");
  }

  async start(previewId: string): Promise<TiendanubeBulkEditJob> {
    return this.parse(jobSchema, await this.httpClient.post(`${basePath}/jobs`, { previewId }), "la operación");
  }

  async getActive(): Promise<TiendanubeBulkEditJob | null> {
    return this.parse(activeJobSchema, await this.httpClient.get(`${basePath}/jobs/active`), "la operación activa");
  }

  async getJob(jobId: string): Promise<TiendanubeBulkEditJob> {
    return this.parse(jobSchema, await this.httpClient.get(`${basePath}/jobs/${encodeURIComponent(jobId)}`), "el estado de la operación");
  }

  async getFailures(jobId: string, page: number, pageSize: number): Promise<TiendanubeBulkEditFailuresPage> {
    const query = new URLSearchParams({ page: String(page), limit: String(pageSize) });
    return this.parse(failuresPageSchema, await this.httpClient.get(`${basePath}/jobs/${encodeURIComponent(jobId)}/failures?${query}`), "los productos fallidos");
  }

  async retryFailures(jobId: string): Promise<TiendanubeBulkEditJob> {
    return this.parse(jobSchema, await this.httpClient.post(`${basePath}/jobs/${encodeURIComponent(jobId)}/retry-failures`, {}), "el reintento");
  }

  private parse<T>(schema: z.ZodType<T>, value: unknown, resource: string): T {
    const parsed = schema.safeParse(value);
    if (parsed.success) return parsed.data;
    throw new ApiError(`El backend devolvió ${resource} inválidos.`, "API_INVALID_RESPONSE", { cause: parsed.error });
  }
}
