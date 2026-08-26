import "server-only";

import { ApiError } from "@/shared/api/api-error";
import type { HttpGetClient } from "@/shared/api/http-client.server";

import type {
  PublicationDetail,
  PublicationsPage,
} from "../domain/publication.model";
import type {
  PublicationsRepository,
  PublicationsRequest,
} from "../domain/publications.repository";
import { mapPublicationDetail } from "./publication-detail.mapper";
import {
  familyDetailResponseSchema,
  publicationDetailResponseSchema,
} from "./publication-detail-response.schema";
import { mapPublicationsResponse } from "./publication.mapper";
import { publicationsResponseSchema } from "./publications-response.schema";

const PUBLICATIONS_ENDPOINT =
  "/mercadolibre/direct/publicaciones/agrupadas";
const FAMILY_ENDPOINT = "/mercadolibre/direct/familias";

/**
 * Implementación HTTP del contrato PublicationsRepository.
 * Es la única capa del módulo que conoce el endpoint y la respuesta de NestJS.
 */
export class PublicationsApiRepository implements PublicationsRepository {
  constructor(private readonly httpClient: HttpGetClient) {}

  async getPublications(
    request: PublicationsRequest,
  ): Promise<PublicationsPage> {
    const query = new URLSearchParams({ limit: String(request.pageSize) });
    if (request.cursor) {
      query.set("cursor", request.cursor);
    }
    if (request.search?.trim()) {
      query.set("search", request.search.trim());
    }
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

    return mapPublicationsResponse(
      validation.data,
      request.pageSize,
      request.cursor,
    );
  }

  async getById(id: string): Promise<PublicationDetail> {
    const response = await this.httpClient.get(
      `/mercadolibre/direct/publicaciones/${encodeURIComponent(id)}`,
    );
    const validation = publicationDetailResponseSchema.safeParse(response);

    if (!validation.success) {
      throw new ApiError(
        "El backend devolvió un detalle de publicación con un formato inválido.",
        "API_INVALID_RESPONSE",
        { cause: validation.error },
      );
    }

    if (validation.data.model !== "VARIANT_PRICING" || !validation.data.familyId) {
      return mapPublicationDetail(validation.data);
    }

    const familyResponse = await this.httpClient.get(
      `${FAMILY_ENDPOINT}/${encodeURIComponent(validation.data.familyId)}`,
    );
    const familyValidation = familyDetailResponseSchema.safeParse(familyResponse);

    if (!familyValidation.success) {
      throw new ApiError(
        "El backend devolvió una familia con un formato inválido.",
        "API_INVALID_RESPONSE",
        { cause: familyValidation.error },
      );
    }

    return mapPublicationDetail(validation.data, familyValidation.data);
  }
}
