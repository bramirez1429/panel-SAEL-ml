// @vitest-environment node

import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import type { AuthenticatedHttpClient } from "@/shared/api/authenticated-http-client.server";
import { SyncApiRepository } from "./sync-api.repository.server";

const syncId = "11111111-1111-4111-8111-111111111111";
const errorId = "22222222-2222-4222-8222-222222222222";

describe("SyncApiRepository", () => {
  it("inicia full sync y consulta su estado por syncId", async () => {
    const http = client();
    http.post.mockResolvedValue({
      ok: true,
      syncId,
      status: "PENDING",
      created: true,
    });
    http.get.mockResolvedValue({
      ok: true,
      syncId,
      status: "RUNNING",
      totalItems: 250,
      processedItems: 145,
      successfulItems: 141,
      failedItems: 4,
      percent: 58,
      productsSaved: 120,
      childrenSaved: 30,
      errorsCount: 4,
      lastError: null,
      startedAt: "2026-09-25T10:00:00.000Z",
      finishedAt: null,
      hasMore: true,
    });
    const repository = new SyncApiRepository(http as unknown as AuthenticatedHttpClient);

    await expect(repository.startFullSync()).resolves.toEqual({
      syncId,
      status: "PENDING",
      created: true,
    });
    await expect(repository.getStatus(syncId)).resolves.toMatchObject({
      id: syncId,
      status: "RUNNING",
      processedItems: 145,
      successfulItems: 141,
      failedItems: 4,
    });
    expect(http.post).toHaveBeenCalledWith("/mercadolibre/publicaciones/sync");
    expect(http.get).toHaveBeenCalledWith(`/mercadolibre/publicaciones/sync/${syncId}`);
  });

  it("mapea overview y conserva el endpoint autenticado", async () => {
    const http = client();
    http.get.mockResolvedValue({
      activeSync: {
        id: syncId,
        status: "RUNNING",
        totalItems: 250,
        processedItems: 145,
        successfulItems: 141,
        failedItems: 4,
        percent: 58,
        startedAt: "2026-09-25T10:00:00.000Z",
      },
      latestSync: null,
      lastSuccessfulSyncAt: "2026-09-21T12:00:00.000Z",
      nextAutomaticSyncAt: "2026-09-29T10:00:00.000Z",
      openErrorsCount: 4,
      openIntegrationEventsCount: 1,
    });

    await expect(new SyncApiRepository(http as unknown as AuthenticatedHttpClient).getOverview()).resolves.toMatchObject({
      activeSync: { id: syncId, processedItems: 145, failedItems: 4 },
      openErrorsCount: 4,
      lastSuccessfulSyncAt: "2026-09-21T12:00:00.000Z",
      integrationEvents: [{ type: "POSSIBLE_API_CHANGE", count: 1 }],
    });
    expect(http.get).toHaveBeenCalledWith("/mercadolibre/publicaciones/sync/overview");
  });

  it("cancela una sincronización activa con el endpoint existente", async () => {
    const http = client();
    http.post.mockResolvedValue({
      ok: true,
      syncId,
      status: "CANCELLED",
      hasMore: false,
    });
    const repository = new SyncApiRepository(http as unknown as AuthenticatedHttpClient);

    await expect(repository.cancelSync(syncId)).resolves.toEqual({
      syncId,
      status: "CANCELLED",
      hasMore: false,
    });
    expect(http.post).toHaveBeenCalledWith(
      `/mercadolibre/publicaciones/sync/${syncId}/cancel`,
    );
  });

  it("mapea errores y usa los endpoints de retry existentes", async () => {
    const http = client();
    http.get.mockResolvedValue([{
      id: errorId,
      sync_job_id: syncId,
      seller_id: 123,
      item_id: "MLA123",
      family_id: "456",
      error_type: "POSSIBLE_API_CHANGE",
      error_code: null,
      error_message: "Respuesta inesperada",
      attempts: 1,
      status: "OPEN",
      created_at: "2026-09-25T10:00:00.000Z",
      updated_at: "2026-09-25T10:00:00.000Z",
      resolved_at: null,
    }]);
    const retryResponse = { syncId, retriedItems: 1, resolvedItems: 1, openErrorsCount: 0 };
    http.post.mockResolvedValue(retryResponse);
    const repository = new SyncApiRepository(http as unknown as AuthenticatedHttpClient);

    await expect(repository.getOpenErrors(syncId)).resolves.toMatchObject([{
      id: errorId,
      itemId: "MLA123",
      familyId: "456",
      type: "POSSIBLE_API_CHANGE",
    }]);
    await repository.retrySelected(syncId, [errorId]);
    await repository.retryAll(syncId);

    expect(http.post).toHaveBeenNthCalledWith(
      1,
      `/mercadolibre/publicaciones/sync/${syncId}/errors/retry-selected`,
      { errorIds: [errorId] },
    );
    expect(http.post).toHaveBeenNthCalledWith(
      2,
      `/mercadolibre/publicaciones/sync/${syncId}/errors/retry-all`,
      undefined,
    );
  });
});

function client() {
  return {
    get: vi.fn(),
    getResponse: vi.fn(),
    post: vi.fn(),
    postResponse: vi.fn(),
    patch: vi.fn(),
    patchResponse: vi.fn(),
    delete: vi.fn(),
    deleteResponse: vi.fn(),
  };
}
