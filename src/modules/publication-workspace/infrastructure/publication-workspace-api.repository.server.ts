import "server-only";

import { ApiError } from "@/shared/api/api-error";
import type { AuthenticatedHttpClient } from "@/shared/api/authenticated-http-client.server";
import type { PublicationEditTarget } from "@/modules/publications/domain/publication-edit.repository";

import { getBestPublicationImage } from "../application/get-best-publication-image";
import type { PublicationWorkspaceRepository, PublicationWorkspaceSearchRequest } from "../domain/publication-workspace.repository";
import {
  publicationWorkspaceDetailResponseSchema,
  publicationWorkspaceFamilyResponseSchema,
  publicationWorkspaceSearchResponseSchema,
} from "./publication-workspace-response.schema";

const SEARCH_ENDPOINT = "/mercadolibre/direct/publicaciones/search";

export class PublicationWorkspaceApiRepository
  implements PublicationWorkspaceRepository
{
  constructor(
    private readonly httpClient: Pick<AuthenticatedHttpClient, "get" | "patch">,
    private readonly loadSku: (target: PublicationEditTarget) => Promise<string | null> = async () => null,
  ) {}

  async search(request: PublicationWorkspaceSearchRequest) {
    const query = new URLSearchParams({
      q: request.query,
      limit: String(request.limit),
    });
    if (request.cursor) query.set("cursor", request.cursor);

    const response = await this.httpClient.get(
      `${SEARCH_ENDPOINT}?${query.toString()}`,
    );
    const validation = publicationWorkspaceSearchResponseSchema.safeParse(response);

    if (!validation.success) {
      throw new ApiError(
        "El backend devolvió resultados de búsqueda con un formato inválido.",
        "API_INVALID_RESPONSE",
        { cause: validation.error },
      );
    }

    return validation.data.items.map((item) => ({
      itemId: item.itemId,
      familyId: item.familyId,
      userProductId: item.userProductId,
      title: item.title ?? item.itemId,
      imageUrl: item.thumbnail,
      price: item.price,
      currency: item.currencyId,
      status: item.status,
      stock: item.stock,
    }));
  }

  async getById(itemId: string) {
    const response = await this.httpClient.get(
      `/mercadolibre/direct/publicaciones/${encodeURIComponent(itemId)}`,
    );
    const validation = publicationWorkspaceDetailResponseSchema.safeParse(response);

    if (!validation.success) {
      throw new ApiError(
        "El backend devolvió un detalle de publicación con un formato inválido.",
        "API_INVALID_RESPONSE",
        { cause: validation.error },
      );
    }

    const publication = validation.data;
    return {
      imageUrl: getBestPublicationImage(publication),
      thumbnailUrl: publication.thumbnail,
      title: publication.title ?? publication.itemId,
      itemId: publication.itemId,
      familyId: publication.familyId,
      model: publication.model,
      sku: publication.sku,
      status: publication.status ?? "Sin estado",
      stock: publication.stock.available,
      price: publication.price.current,
      currency: publication.price.currency,
    };
  }

  async getFamily(familyId: string) {
    const response = await this.httpClient.get(
      `/mercadolibre/direct/familias/${encodeURIComponent(familyId)}/resumen`,
    );
    const validation = publicationWorkspaceFamilyResponseSchema.safeParse(response);

    if (!validation.success) {
      throw new ApiError(
        "El backend devolvió una familia con un formato inválido.",
        "API_INVALID_RESPONSE",
        { cause: validation.error },
      );
    }

    const family = validation.data;
    const children = await Promise.all(
      family.variants.flatMap((variant) => variant.items).map(async (item) => ({
        imageUrl: getBestPublicationImage(item),
        thumbnailUrl: item.thumbnail,
        title: item.title ?? item.itemId,
        itemId: item.itemId,
        familyId: family.familyId,
        model: "VARIANT_PRICING" as const,
        sku: await this.loadSku({ type: "family", familyId: family.familyId, itemId: item.itemId }),
        status: item.status ?? "Sin estado",
        stock: item.stock,
        price: item.price,
        currency: null,
      })),
    );

    return {
      type: "family" as const,
      familyId: family.familyId,
      familyName: family.familyName,
      imageUrl: children[0]?.thumbnailUrl ?? null,
      children,
    };
  }

  async updateTitle(
    target:
      | Readonly<{ type: "publication"; itemId: string }>
      | Readonly<{ type: "family"; familyId: string }>,
    title: string,
  ): Promise<void> {
    if (target.type === "family") {
      await this.httpClient.patch(
        `/mercadolibre/direct/edicion/nueva/${encodeURIComponent(target.familyId)}`,
        { familyName: title },
      );
      return;
    }

    await this.httpClient.patch(
      `/mercadolibre/direct/edicion/clasica/${encodeURIComponent(target.itemId)}`,
      { title },
    );
  }
}
