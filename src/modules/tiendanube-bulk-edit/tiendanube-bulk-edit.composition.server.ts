import "server-only";

import { getApiConfig } from "@/shared/api/api-config";
import { createAuthenticatedHttpClient } from "@/shared/api/authenticated-http-client.server";
import { HttpClient } from "@/shared/api/http-client.server";
import { TiendanubeBulkEditApiRepository } from "./infrastructure/tiendanube-bulk-edit-api.repository.server";

export function createTiendanubeBulkEditRepository(): TiendanubeBulkEditApiRepository {
  return new TiendanubeBulkEditApiRepository(createAuthenticatedHttpClient(new HttpClient(getApiConfig())));
}
