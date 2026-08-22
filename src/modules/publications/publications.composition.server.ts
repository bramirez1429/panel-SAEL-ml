import "server-only";

import { getApiConfig } from "@/shared/api/api-config";
import { createAuthenticatedHttpClient } from "@/shared/api/authenticated-http-client.server";
import { HttpClient } from "@/shared/api/http-client.server";

import { GetPublicationByIdQuery } from "./application/get-publication-by-id.query";
import { GetPublicationsQuery } from "./application/get-publications.query";
import { PublicationsApiRepository } from "./infrastructure/publications-api.repository.server";

/**
 * Punto de composición server-only: conecta el caso de uso con infraestructura
 * sin introducir un contenedor de dependencias ni filtrar configuración al cliente.
 */
export function createGetPublicationsQuery(): GetPublicationsQuery {
  const httpClient = createAuthenticatedHttpClient(
    new HttpClient(getApiConfig()),
  );
  const repository = new PublicationsApiRepository(httpClient);

  return new GetPublicationsQuery(repository);
}

export function createGetPublicationByIdQuery(): GetPublicationByIdQuery {
  const httpClient = createAuthenticatedHttpClient(
    new HttpClient(getApiConfig()),
  );
  const repository = new PublicationsApiRepository(httpClient);

  return new GetPublicationByIdQuery(repository);
}
