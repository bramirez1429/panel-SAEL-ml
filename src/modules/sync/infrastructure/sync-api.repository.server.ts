import "server-only";

import type { AuthenticatedHttpClient } from "@/shared/api/authenticated-http-client.server";
import { ApiError } from "@/shared/api/api-error";

import type { SyncRepository } from "../domain/sync.repository";
import type {
  RetrySyncErrorsResult,
  StartSyncResult,
  SyncError,
  SyncJob,
  SyncOverview,
} from "../domain/sync.model";
import {
  retrySyncErrorsResponseSchema,
  startSyncResponseSchema,
  syncErrorsResponseSchema,
  syncOverviewResponseSchema,
  syncStatusResponseSchema,
} from "./sync-response.schema";

const SYNC_PATH = "/mercadolibre/publicaciones/sync";

export class SyncApiRepository implements SyncRepository {
  constructor(private readonly http: AuthenticatedHttpClient) {}

  async getOverview(): Promise<SyncOverview> {
    const parsed = syncOverviewResponseSchema.safeParse(
      await this.http.get(`${SYNC_PATH}/overview`),
    );
    if (!parsed.success) throw invalidResponse();
    const { activeSync, latestSync, openIntegrationEventsCount } = parsed.data;
    return {
      activeSync: activeSync ? {
        ...activeSync,
        lastError: null,
        finishedAt: null,
      } : null,
      latestSync: latestSync ? {
        ...latestSync,
        lastError: null,
        startedAt: null,
      } : null,
      nextAutomaticSyncAt: parsed.data.nextAutomaticSyncAt,
      openErrorsCount: parsed.data.openErrorsCount,
      integrationEvents: openIntegrationEventsCount > 0
        ? [{ type: "POSSIBLE_API_CHANGE", count: openIntegrationEventsCount }]
        : [],
    };
  }

  async startFullSync(): Promise<StartSyncResult> {
    const parsed = startSyncResponseSchema.safeParse(
      await this.http.post(SYNC_PATH),
    );
    if (!parsed.success) throw invalidResponse();
    return {
      syncId: parsed.data.syncId,
      status: parsed.data.status,
      created: parsed.data.created,
    };
  }

  async getStatus(syncId: string): Promise<SyncJob> {
    const parsed = syncStatusResponseSchema.safeParse(
      await this.http.get(`${SYNC_PATH}/${encodeURIComponent(syncId)}`),
    );
    if (!parsed.success) throw invalidResponse();
    return {
      id: parsed.data.syncId,
      status: parsed.data.status,
      totalItems: parsed.data.totalItems,
      processedItems: parsed.data.processedItems,
      successfulItems: parsed.data.successfulItems,
      failedItems: parsed.data.failedItems,
      startedAt: null,
      finishedAt: null,
      lastError: parsed.data.lastError,
    };
  }

  async getOpenErrors(syncId: string): Promise<readonly SyncError[]> {
    const parsed = syncErrorsResponseSchema.safeParse(
      await this.http.get(`${SYNC_PATH}/${encodeURIComponent(syncId)}/errors`),
    );
    if (!parsed.success) throw invalidResponse();
    return parsed.data.map((error) => ({
      id: error.id,
      syncId: error.sync_job_id,
      itemId: error.item_id,
      familyId: error.family_id,
      type: error.error_type,
      code: error.error_code,
      message: error.error_message,
      attempts: error.attempts,
      status: error.status,
      createdAt: error.created_at,
      updatedAt: error.updated_at,
    }));
  }

  retryOne(syncId: string, errorId: string): Promise<RetrySyncErrorsResult> {
    return this.retry(`${SYNC_PATH}/${encodeURIComponent(syncId)}/errors/${encodeURIComponent(errorId)}/retry`);
  }

  retrySelected(syncId: string, errorIds: readonly string[]): Promise<RetrySyncErrorsResult> {
    return this.retry(`${SYNC_PATH}/${encodeURIComponent(syncId)}/errors/retry-selected`, {
      errorIds: [...errorIds],
    });
  }

  retryAll(syncId: string): Promise<RetrySyncErrorsResult> {
    return this.retry(`${SYNC_PATH}/${encodeURIComponent(syncId)}/errors/retry-all`);
  }

  private async retry(path: string, body?: unknown): Promise<RetrySyncErrorsResult> {
    const parsed = retrySyncErrorsResponseSchema.safeParse(
      await this.http.post(path, body),
    );
    if (!parsed.success) throw invalidResponse();
    return parsed.data;
  }
}

function invalidResponse(): ApiError {
  return new ApiError(
    "El backend devolvió una respuesta de sincronización inválida.",
    "API_INVALID_RESPONSE",
  );
}
