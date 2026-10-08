// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));

import type { AuthenticatedHttpClient } from "@/shared/api/authenticated-http-client.server";
import { TiendanubeProductsApiRepository } from "./tiendanube-products-api.repository.server";

function client() {
  return { get: vi.fn() } satisfies Pick<AuthenticatedHttpClient, "get">;
}

describe("TiendanubeProductsApiRepository", () => {
  it("envía q y la paginación al endpoint de productos", async () => {
    const http = client();
    vi.mocked(http.get).mockResolvedValue({ items: [], page: 2, pageSize: 20, total: 0 });

    await new TiendanubeProductsApiRepository(http).getProducts({ q: "remera azul", page: 2, pageSize: 20 });

    expect(http.get).toHaveBeenCalledWith("/tiendanube/products?page=2&pageSize=20&q=remera+azul");
  });

  it("conserva los datos de cada variante sin mezclarlos", async () => {
    const http = client();
    vi.mocked(http.get).mockResolvedValue({
      items: [{
        id: "tn-1",
        name: "Remera",
        imageUrl: "https://example.com/remera.jpg",
        status: "active",
        tags: ["verano"],
        variants: [
          { id: "variant-m", size: "M", color: "Negro", sku: "REM-M", stock: 4, price: 47000, promotionalPrice: 42000 },
          { id: "variant-l", size: "L", color: "Negro", sku: "REM-L", stock: 2, price: 48000, promotionalPrice: null },
        ],
      }],
      page: 1,
      pageSize: 20,
      total: 1,
    });

    await expect(new TiendanubeProductsApiRepository(http).getProducts({ q: "", page: 1, pageSize: 20 })).resolves.toMatchObject({
      products: [{ variants: [{ stock: 4, price: 47000, promotionalPrice: 42000 }, { stock: 2, price: 48000, promotionalPrice: null }] }],
    });
  });
});
