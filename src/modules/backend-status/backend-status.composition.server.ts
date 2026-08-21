import "server-only";

import { getApiConfig } from "@/shared/api/api-config";
import { HttpClient } from "@/shared/api/http-client.server";

import { GetBackendStatusQuery } from "./application/get-backend-status.query";
import { BackendStatusApiRepository } from "./infrastructure/backend-status-api.repository";

// This server-only composition keeps infrastructure choices outside the use case.
export function createGetBackendStatusQuery(): GetBackendStatusQuery {
  const httpClient = new HttpClient(getApiConfig());
  const repository = new BackendStatusApiRepository(httpClient);

  return new GetBackendStatusQuery(repository);
}
