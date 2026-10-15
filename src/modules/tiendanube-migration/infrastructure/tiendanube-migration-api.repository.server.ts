import "server-only";

import { ApiError } from "@/shared/api/api-error";
import type { AuthenticatedHttpClient } from "@/shared/api/authenticated-http-client.server";

import type { TiendanubeMigrationOutcome, TiendanubeMigrationProgress, TiendanubeMigrationResult, TiendanubeMigrationResultsPage } from "../domain/tiendanube-migration.model";
import type { TiendanubeMigrationRepository } from "../domain/tiendanube-migration.repository";
import { tiendanubeMigrationActiveResponseSchema, tiendanubeMigrationProgressSchema, tiendanubeMigrationResultsPageSchema } from "./tiendanube-migration.schema";

const migrationPath = "/tiendanube/migration";

export class TiendanubeMigrationApiRepository implements TiendanubeMigrationRepository {
  constructor(private readonly httpClient: AuthenticatedHttpClient) {}

  async start(testLimit?: 1 | 5 | 10): Promise<TiendanubeMigrationProgress> {
    const body = testLimit === undefined ? undefined : { testLimit };
    return this.parseProgress(await this.httpClient.post(`${migrationPath}/start`, body));
  }

  async resumeOne(jobId: string, singleProduct = true): Promise<TiendanubeMigrationProgress> {
    const path = migrationPath + "/" + encodeURIComponent(jobId) + "/resume";
    return this.parseProgress(
      await this.httpClient.post(path, { singleProduct })
    );
  }

  async getActive(): Promise<TiendanubeMigrationProgress | null> {
    const parsed = tiendanubeMigrationActiveResponseSchema.safeParse(await this.httpClient.get(`${migrationPath}/active`));
    if (!parsed.success) throw this.invalidResponse("un trabajo activo de migración");
    return parsed.data === null ? null : mapProgress(parsed.data);
  }

  async getStatus(jobId: string): Promise<TiendanubeMigrationProgress> {
    return this.parseProgress(await this.httpClient.get(`${migrationPath}/${encodeURIComponent(jobId)}`));
  }

  async getResults(jobId: string, outcome: TiendanubeMigrationOutcome, page: number, pageSize: number): Promise<TiendanubeMigrationResultsPage> {
    const query = new URLSearchParams({ status: outcome, page: String(page), limit: String(pageSize) });
    const parsed = tiendanubeMigrationResultsPageSchema.safeParse(
      await this.httpClient.get(`${migrationPath}/${encodeURIComponent(jobId)}/items?${query.toString()}`),
    );
    if (!parsed.success) throw this.invalidResponse("los resultados de la migración");
    return {
      page: parsed.data.page,
      limit: parsed.data.limit,
      total: parsed.data.total,
      items: parsed.data.items.map(mapResult),
    };
  }

  private parseProgress(response: unknown): TiendanubeMigrationProgress {
    const parsed = tiendanubeMigrationProgressSchema.safeParse(response);
    if (!parsed.success) throw this.invalidResponse("el estado de la migración");
    return mapProgress(parsed.data);
  }

  private invalidResponse(resource: string): ApiError {
    return new ApiError(`El backend devolvió ${resource} inválidos.`, "API_INVALID_RESPONSE");
  }
}

type BackendProgress = ReturnType<typeof tiendanubeMigrationProgressSchema.parse>;
type BackendItem = ReturnType<typeof tiendanubeMigrationResultsPageSchema.parse>["items"][number];

function mapProgress(progress: BackendProgress): TiendanubeMigrationProgress {
  return {
    id: progress.id,
    status: progress.status,
    totalItems: progress.totalItems,
    processedItems: progress.processedItems,
    approvedItems: progress.approvedItems,
    rejectedItems: progress.rejectedItems,
    currentSourceKey: progress.currentSourceKey,
  };
}

function mapResult(item: BackendItem): TiendanubeMigrationResult {
  return {
    id: item.id,
    sourceKey: item.sourceKey,
    title: item.title,
    mlaIds: item.mlaIds,
    familyId: item.familyId,
    mlauIds: item.mlauIds,
    status: item.status,
    outcome: item.outcome,
    tiendanubeProductId: item.tiendanubeProductId,
    errorCode: item.errorCode,
    errorMessage: item.errorMessage,
    attempts: item.attempts,
    updatedAt: item.updatedAt,
    action: item.outcome === "ALREADY_EXISTS" ? "LINKED" : item.outcome === "CREATED" ? "CREATED" : null,
  };
}
