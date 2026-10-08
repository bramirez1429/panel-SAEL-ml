// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));

import type { AuthenticatedHttpClient } from "@/shared/api/authenticated-http-client.server";
import { TiendanubeProductsApiRepository } from "./tiendanube-products-api.repository.server";

function client() {
  return { get: vi.fn() } satisfies Pick<AuthenticatedHttpClient, "get">;
}

describe("TiendanubeProductsApiRepository", () => {
  it("sends q and pagination to the catalog endpoint", async () => {
    const http = client();
    vi.mocked(http.get).mockResolvedValue({ products: [], page: 2, hasMore: false, total: 0 });

    await new TiendanubeProductsApiRepository(http).getProducts({ q: "remera azul", page: 2, pageSize: 20 });

    expect(http.get).toHaveBeenCalledWith("/tiendanube/products/catalog?page=2&limit=20&q=remera+azul");
  });

  it("maps the catalog response without fabricating nullable variant values", async () => {
    const http = client();
    vi.mocked(http.get).mockResolvedValue({
      products: [{
        id: 1001,
        name: { es: "Remera" },
        mainImage: "https://example.com/remera.jpg",
        tags: ["verano"],
        published: true,
        visibility: "visible",
        variants: [
          {
            id: 1101,
            attributes: [
              { name: { es: "Talle" }, value: { es: "M" } },
              { name: { es: "Color" }, value: { es: "Negro" } },
            ],
            sku: "REM-M",
            stock: 4,
            stockManagement: true,
            price: 47000,
            promotionalPrice: 42000,
          },
          {
            id: 1102,
            attributes: [],
            sku: null,
            stock: null,
            stockManagement: false,
            price: 48000,
            promotionalPrice: null,
          },
        ],
      }],
      page: 1,
      hasMore: true,
    });

    await expect(new TiendanubeProductsApiRepository(http).getProducts({ q: "", page: 1, pageSize: 20 })).resolves.toEqual({
      page: 1,
      pageSize: 20,
      hasMore: true,
      products: [{
        id: "1001",
        name: "Remera",
        imageUrl: "https://example.com/remera.jpg",
        status: "visible",
        tags: ["verano"],
        variants: [
          {
            id: "1101",
            size: "M",
            color: "Negro",
            sku: "REM-M",
            stock: 4,
            price: 47000,
            promotionalPrice: 42000,
          },
          {
            id: "1102",
            size: null,
            color: null,
            sku: null,
            stock: null,
            price: 48000,
            promotionalPrice: null,
          },
        ],
      }],
    });
  });
});
