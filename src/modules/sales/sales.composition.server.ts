import "server-only";

import { getApiConfig } from "@/shared/api/api-config";
import { createAuthenticatedHttpClient } from "@/shared/api/authenticated-http-client.server";
import { HttpClient } from "@/shared/api/http-client.server";

import { SalesApiRepository } from "./infrastructure/sales-api.repository.server";

export function createSalesRepository() {
  return new SalesApiRepository(
    createAuthenticatedHttpClient(
      new HttpClient(getApiConfig()),
    ),
  );
}

