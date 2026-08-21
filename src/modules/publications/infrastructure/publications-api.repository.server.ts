import "server-only";

import { ApiError } from "@/shared/api/api-error";
import type { HttpGetClient } from "@/shared/api/http-client.server";

import type { PublicationsPage } from "../domain/publication.model";
import type {
  PublicationsRepository,
  PublicationsRequest,
} from "../domain/publications.repository";
import { mapPublicationsResponse } from "./publication.mapper";
import { publicationsResponseSchema } from "./publications-response.schema";

const PUBLICATIONS_ENDPOINT = "/mercadolibre/publicaciones";

/**
 * Implementación HTTP del contrato PublicationsRepository.
 * Es la única capa del módulo que conoce el endpoint y la respuesta de NestJS.
 */
export class PublicationsApiRepository implements PublicationsRepository {
  constructor(private readonly httpClient: HttpGetClient) {}

  async getPublications(
    request: PublicationsRequest,
  ): Promise<PublicationsPage> {
    const query = new URLSearchParams({
      page: String(request.page),
      limit: String(request.pageSize),
    });
    const response = await this.httpClient.get(
      `${PUBLICATIONS_ENDPOINT}?${query.toString()}`,
    );
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
