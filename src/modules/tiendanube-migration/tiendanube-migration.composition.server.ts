import "server-only";

import { getApiConfig } from "@/shared/api/api-config";
import { createAuthenticatedHttpClient } from "@/shared/api/authenticated-http-client.server";
import { HttpClient } from "@/shared/api/http-client.server";

import { GetActiveTiendanubeMigrationQuery } from "./application/get-active-tiendanube-migration.query";
import { GetTiendanubeMigrationResultsQuery } from "./application/get-tiendanube-migration-results.query";
import { GetTiendanubeMigrationStatusQuery } from "./application/get-tiendanube-migration-status.query";
import { ResumeOneTiendanubeMigrationCommand } from "./application/resume-one-tiendanube-migration.command";
import { CancelTiendanubeMigrationCommand } from "./application/cancel-tiendanube-migration.command";
import { PauseTiendanubeMigrationCommand } from "./application/pause-tiendanube-migration.command";
import { StartTiendanubeMigrationCommand } from "./application/start-tiendanube-migration.command";
import { TiendanubeMigrationApiRepository } from "./infrastructure/tiendanube-migration-api.repository.server";

function createRepository(): TiendanubeMigrationApiRepository {
  return new TiendanubeMigrationApiRepository(createAuthenticatedHttpClient(new HttpClient(getApiConfig())));
}

export function createResumeOneTiendanubeMigrationCommand() {
  return new ResumeOneTiendanubeMigrationCommand(createRepository());
}
export function createCancelTiendanubeMigrationCommand() {
  return new CancelTiendanubeMigrationCommand(createRepository());
}
export function createPauseTiendanubeMigrationCommand() {
  return new PauseTiendanubeMigrationCommand(createRepository());
}
export function createStartTiendanubeMigrationCommand() { return new StartTiendanubeMigrationCommand(createRepository()); }
export function createGetActiveTiendanubeMigrationQuery() { return new GetActiveTiendanubeMigrationQuery(createRepository()); }
export function createGetTiendanubeMigrationStatusQuery() { return new GetTiendanubeMigrationStatusQuery(createRepository()); }
export function createGetTiendanubeMigrationResultsQuery() { return new GetTiendanubeMigrationResultsQuery(createRepository()); }
