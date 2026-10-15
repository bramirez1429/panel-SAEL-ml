import "server-only";

import { ApiError } from "@/shared/api/api-error";
import type { AuthenticatedHttpClient } from "@/shared/api/authenticated-http-client.server";

import type { TiendanubeMigrationOutcome, TiendanubeMigrationProgress, TiendanubeMigrationResultsPage } from "../domain/tiendanube-migration.model";
import type { TiendanubeMigrationRepository } from "../domain/tiendanube-migration.repository";
import { tiendanubeMigrationActiveResponseSchema, tiendanubeMigrationProgressSchema, tiendanubeMigrationResultsPageSchema } from "./tiendanube-migration.schema";

const migrationPath = "/tiendanube/migration/global";

/** Mantiene los contratos de migración global aislados hasta confirmar los endpoints del backend. */
export class TiendanubeMigrationApiRepository implements TiendanubeMigrationRepository {
  constructor(private readonly httpClient: AuthenticatedHttpClient) {}

  async start(): Promise<TiendanubeMigrationProgress> {
    return this.parseProgress(await this.httpClient.post(migrationPath));
  }

  async getActive(): Promise<TiendanubeMigrationProgress | null> {
    const parsed = tiendanubeMigrationActiveResponseSchema.safeParse(await this.httpClient.get(`${migrationPath}/active`));
    if (!parsed.success) throw this.invalidResponse("un trabajo activo de migración");
    return parsed.data.activeMigration;
  }

  async getStatus(jobId: string): Promise<TiendanubeMigrationProgress> {
    return this.parseProgress(await this.httpClient.get(`${migrationPath}/${encodeURIComponent(jobId)}`));
  }

  async getResults(jobId: string, outcome: TiendanubeMigrationOutcome, page: number, pageSize: number): Promise<TiendanubeMigrationResultsPage> {
    const query = new URLSearchParams({ outcome, page: String(page), pageSize: String(pageSize) });
    const parsed = tiendanubeMigrationResultsPageSchema.safeParse(
      await this.httpClient.get(`${migrationPath}/${encodeURIComponent(jobId)}/results?${query.toString()}`),
    );
    if (!parsed.success) throw this.invalidResponse("los resultados de la migración");
    return parsed.data;
  }

  private parseProgress(response: unknown): TiendanubeMigrationProgress {
    const parsed = tiendanubeMigrationProgressSchema.safeParse(response);
    if (!parsed.success) throw this.invalidResponse("el estado de la migración");
    return parsed.data;
  }

  private invalidResponse(resource: string): ApiError {
    return new ApiError(`El backend devolvió ${resource} inválidos.`, "API_INVALID_RESPONSE");
  }
}
