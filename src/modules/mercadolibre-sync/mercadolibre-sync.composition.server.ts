import "server-only";

import { getApiConfig } from "@/shared/api/api-config";
import { createAuthenticatedHttpClient } from "@/shared/api/authenticated-http-client.server";
import { HttpClient } from "@/shared/api/http-client.server";

import { GetMercadolibreSyncStatusQuery } from "./application/get-mercadolibre-sync-status.query";
import { CancelMercadolibreSyncCommand } from "./application/cancel-mercadolibre-sync.command";
import { GetMercadolibreActiveSyncQuery } from "./application/get-mercadolibre-active-sync.query";
import { StartMercadolibreSyncCommand } from "./application/start-mercadolibre-sync.command";
import { MercadolibreSyncApiRepository } from "./infrastructure/mercadolibre-sync-api.repository.server";

function createRepository(): MercadolibreSyncApiRepository {
  return new MercadolibreSyncApiRepository(
    createAuthenticatedHttpClient(new HttpClient(getApiConfig())),
  );
}

export function createStartMercadolibreSyncCommand(): StartMercadolibreSyncCommand {
  return new StartMercadolibreSyncCommand(createRepository());
}

export function createGetMercadolibreSyncStatusQuery(): GetMercadolibreSyncStatusQuery {
  return new GetMercadolibreSyncStatusQuery(createRepository());
}

export function createGetMercadolibreActiveSyncQuery(): GetMercadolibreActiveSyncQuery {
  return new GetMercadolibreActiveSyncQuery(createRepository());
}

export function createCancelMercadolibreSyncCommand(): CancelMercadolibreSyncCommand {
  return new CancelMercadolibreSyncCommand(createRepository());
}
