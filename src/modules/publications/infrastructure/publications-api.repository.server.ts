import "server-only";

import { ApiError } from "@/shared/api/api-error";
import type { HttpGetClient } from "@/shared/api/http-client.server";

import type { PublicationsPage } from "../domain/publication.model";
import type { PublicationsRepository } from "../domain/publications.repository";
import { mapPublicationsResponse } from "./publication.mapper";
import { publicationsResponseSchema } from "./publications-response.schema";

const PUBLICATIONS_ENDPOINT = "/mercadolibre/publicaciones?page=1&limit=20";

/**
 * Implementación HTTP del contrato PublicationsRepository.
 * Es la única capa del módulo que conoce el endpoint y la respuesta de NestJS.
 */
export class PublicationsApiRepository implements PublicationsRepository {
  constructor(private readonly httpClient: HttpGetClient) {}

  async getPublications(): Promise<PublicationsPage> {
    const response = await this.httpClient.get(PUBLICATIONS_ENDPOINT);
    const validation = publicationsResponseSchema.safeParse(response);

    if (!validation.success) {
      throw new ApiError(
        "El backend devolvió publicaciones con un formato inválido.",
        "API_INVALID_RESPONSE",
        { cause: validation.error },
      );
    }

    return mapPublicationsResponse(validation.data);
  }
}
