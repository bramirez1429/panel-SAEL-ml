import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { TiendanubeProductsPage } from "../domain/tiendanube-products.model";

const navigation = vi.hoisted(() => ({
  push: vi.fn(),
  params: new URLSearchParams(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: navigation.push }),
  useSearchParams: () => navigation.params,
}));

import { TiendanubeProductsPageClient } from "./tiendanube-products-page.client";

describe("TiendanubeProductsPageClient", () => {
  beforeEach(() => {
    navigation.push.mockReset();
    [...navigation.params.keys()].forEach((key) => navigation.params.delete(key));
  });
  afterEach(cleanup);

  it("envía la búsqueda al backend desde la URL y reinicia la página", async () => {
    const user = userEvent.setup();
    navigation.params.set("page", "3");
    render(<TiendanubeProductsPageClient activeSearch="" page={page()} />);

    const search = screen.getByPlaceholderText("Buscar por nombre, SKU o tags");
    await user.type(search, "remera");
    await user.keyboard("{Enter}");

    expect(navigation.push).toHaveBeenCalledWith("/tiendanube/productos?q=remera");
  });

  it("muestra pocas variantes y permite expandir el producto", async () => {
    const user = userEvent.setup();
    render(<TiendanubeProductsPageClient activeSearch="" page={page(4)} />);

    expect(screen.getByText("SKU-1")).toBeInTheDocument();
    expect(screen.queryByText("SKU-4")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Ver más variantes" }));

    expect(screen.getByText("SKU-4")).toBeInTheDocument();
  });
});

function page(variantCount = 4): TiendanubeProductsPage {
  return {
    page: 1,
    pageSize: 20,
    total: 1,
    products: [{
      id: "product-1",
      name: "Remera",
      imageUrl: null,
      status: "active",
      tags: ["verano"],
      variants: Array.from({ length: variantCount }, (_, index) => ({
        id: `variant-${index + 1}`,
        size: ["S", "M", "L", "XL"][index] ?? null,
        color: "Negro",
        sku: `SKU-${index + 1}`,
        stock: index + 1,
        price: 45_000 + index * 1_000,
        promotionalPrice: null,
      })),
    }],
  };
}
