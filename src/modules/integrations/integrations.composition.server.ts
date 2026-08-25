import "server-only";

import { getApiConfig } from "@/shared/api/api-config";
import { createAuthenticatedHttpClient } from "@/shared/api/authenticated-http-client.server";
import { HttpClient } from "@/shared/api/http-client.server";

import { MercadoLibreApiRepository } from "./infrastructure/mercado-libre-api.repository.server";
import { TiendanubeApiRepository } from "./infrastructure/tiendanube-api.repository.server";

export function createMercadoLibreApiRepository(): MercadoLibreApiRepository {
  return new MercadoLibreApiRepository(
    createAuthenticatedHttpClient(new HttpClient(getApiConfig())),
  );
}

export function createTiendanubeApiRepository(): TiendanubeApiRepository {
  return new TiendanubeApiRepository(
    createAuthenticatedHttpClient(new HttpClient(getApiConfig())),
  );
}
