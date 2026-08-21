import "server-only";

import { getApiConfig } from "@/shared/api/api-config";
import { HttpClient } from "@/shared/api/http-client.server";

import { GetPublicationsQuery } from "./application/get-publications.query";
import { PublicationsApiRepository } from "./infrastructure/publications-api.repository.server";

/**
 * Punto de composición server-only: conecta el caso de uso con infraestructura
 * sin introducir un contenedor de dependencias ni filtrar configuración al cliente.
 */
export function createGetPublicationsQuery(): GetPublicationsQuery {
  const httpClient = new HttpClient(getApiConfig());
  const repository = new PublicationsApiRepository(httpClient);

  return new GetPublicationsQuery(repository);
}
