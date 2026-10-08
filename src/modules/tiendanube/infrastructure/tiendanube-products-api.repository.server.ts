import "server-only";

import { ApiError } from "@/shared/api/api-error";
import type { AuthenticatedHttpClient } from "@/shared/api/authenticated-http-client.server";

import type { TiendanubeProductsRepository } from "../domain/tiendanube-products.repository";
import type { TiendanubeProductsPage, TiendanubeProductsRequest } from "../domain/tiendanube-products.model";
import { tiendanubeProductsResponseSchema } from "./tiendanube-products-response.schema";

type CatalogVariantAttribute = Readonly<{
  name: Readonly<{ es: string }> | null;
  value: Readonly<{ es: string }>;
}>;

export class TiendanubeProductsApiRepository implements TiendanubeProductsRepository {
  constructor(private readonly httpClient: Pick<AuthenticatedHttpClient, "get">) {}

  async getProducts(request: TiendanubeProductsRequest): Promise<TiendanubeProductsPage> {
    const query = new URLSearchParams({
      page: String(request.page),
      limit: String(request.pageSize),
    });
    if (request.q.trim()) query.set("q", request.q.trim());

    const parsed = tiendanubeProductsResponseSchema.safeParse(
      await this.httpClient.get(`/tiendanube/products/catalog?${query.toString()}`),
    );
    if (!parsed.success) {
      throw new ApiError(
        "El backend devolvió productos de Tiendanube inválidos.",
        "API_INVALID_RESPONSE",
        { cause: parsed.error },
      );
    }

    return {
      page: parsed.data.page,
      pageSize: request.pageSize,
      hasMore: parsed.data.hasMore,
      ...(parsed.data.total === undefined ? {} : { total: parsed.data.total }),
      products: parsed.data.products.map((item) => ({
        id: String(item.id),
        name: item.name.es,
        imageUrl: item.mainImage,
        status: item.visibility,
        tags: item.tags,
        variants: item.variants.map((variant) => ({
          id: String(variant.id),
          size: attributeValue(variant.attributes, ["talle", "tamano", "size"]),
          color: attributeValue(variant.attributes, ["color"]),
          sku: variant.sku,
          stock: variant.stock,
          price: variant.price,
          promotionalPrice: variant.promotionalPrice,
        })),
      })),
    };
  }
}

function attributeValue(
  attributes: readonly CatalogVariantAttribute[],
  names: readonly string[],
): string | null {
  const attribute = attributes.find((candidate) =>
    candidate.name !== null && names.includes(candidate.name.es.toLocaleLowerCase("es")),
  );

  return attribute?.value.es ?? null;
}
