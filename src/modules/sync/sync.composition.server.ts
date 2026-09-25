import "server-only";

import { getApiConfig } from "@/shared/api/api-config";
import { createAuthenticatedHttpClient } from "@/shared/api/authenticated-http-client.server";
import { HttpClient } from "@/shared/api/http-client.server";

import { SyncApiRepository } from "./infrastructure/sync-api.repository.server";

export function createSyncRepository(): SyncApiRepository {
  return new SyncApiRepository(
    createAuthenticatedHttpClient(new HttpClient(getApiConfig())),
  );
}
