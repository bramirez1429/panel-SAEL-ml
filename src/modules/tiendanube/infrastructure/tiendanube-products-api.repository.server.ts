import "server-only";

import { ApiError } from "@/shared/api/api-error";
import type { AuthenticatedHttpClient } from "@/shared/api/authenticated-http-client.server";

import type { TiendanubeProductsRepository } from "../domain/tiendanube-products.repository";
import type { TiendanubeProductsPage, TiendanubeProductsRequest } from "../domain/tiendanube-products.model";
import { tiendanubeProductsResponseSchema } from "./tiendanube-products-response.schema";

export class TiendanubeProductsApiRepository implements TiendanubeProductsRepository {
  constructor(private readonly httpClient: Pick<AuthenticatedHttpClient, "get">) {}

  async getProducts(request: TiendanubeProductsRequest): Promise<TiendanubeProductsPage> {
    const query = new URLSearchParams({
      page: String(request.page),
      pageSize: String(request.pageSize),
    });
    if (request.q.trim()) query.set("q", request.q.trim());

    const parsed = tiendanubeProductsResponseSchema.safeParse(
      await this.httpClient.get(`/tiendanube/products?${query.toString()}`),
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
      pageSize: parsed.data.pageSize,
      total: parsed.data.total,
      products: parsed.data.items.map((item) => ({
        id: item.id,
        name: item.name,
        imageUrl: item.imageUrl ?? null,
        status: item.status,
        tags: item.tags ?? [],
        variants: item.variants.map((variant) => ({
          id: variant.id,
          size: variant.size ?? null,
          color: variant.color ?? null,
          sku: variant.sku ?? null,
          stock: variant.stock,
          price: variant.price,
          promotionalPrice: variant.promotionalPrice,
        })),
      })),
    };
  }
}
