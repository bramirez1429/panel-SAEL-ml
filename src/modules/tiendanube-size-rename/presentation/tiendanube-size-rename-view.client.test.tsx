import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { TiendanubeProductsPage } from "@/modules/tiendanube/domain/tiendanube-products.model";
import { TiendanubeSizeRenameView } from "./tiendanube-size-rename-view.client";

afterEach(cleanup);

function page(
  number: number,
  hasMore: boolean,
  products: TiendanubeProductsPage["products"],
): TiendanubeProductsPage {
  return { page: number, pageSize: 100, hasMore, products };
}

const page1 = page(1, true, [{
  id: "p1", name: "Buzo de mujer algodón",
  imageUrl: "https://example.com/buzo.jpg",
  status: "visible", tags: ["buzos"],
  variants: [
    { id: "v1", size: "S", color: "Negro", sku: "B-40", stock: 10, price: 45000, promotionalPrice: null },
    { id: "v2", size: "M", color: "Negro", sku: "B-42", stock: 8, price: 45000, promotionalPrice: null },
  ],
}]);

const page2 = page(2, false, [{
  id: "p2", name: "Buzo de mujer frizado",
  imageUrl: null,
  status: "visible", tags: ["buzos"],
  variants: [
    { id: "v3", size: "S", color: "Gris", sku: "B2-S", stock: 0, price: 55000, promotionalPrice: null },
    { id: "v4", size: "2XL", color: "Marrón", sku: "B2-2XL", stock: 4, price: 55000, promotionalPrice: null },
  ],
}]);

describe("TiendanubeSizeRenameView", () => {
  it("trae todas las páginas y talles de todos los colores sin seleccionar ni mostrar productos individuales", async () => {
    const user = userEvent.setup();
    const loadPageAction = vi.fn(async (_query: string, nextPage: number) => ({
      ok: true as const,
      data: nextPage === 1 ? page1 : page2,
    }));
    render(<TiendanubeSizeRenameView loadPageAction={loadPageAction} />);

    expect(loadPageAction).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Buscar todos" }));
    expect(await screen.findByText('Resultados completos: "buzo de mujer"')).toBeInTheDocument();

    expect(loadPageAction).toHaveBeenCalledTimes(2);
    expect(loadPageAction).toHaveBeenNthCalledWith(1, "buzo de mujer", 1);
    expect(loadPageAction).toHaveBeenNthCalledWith(2, "buzo de mujer", 2);
    expect(screen.queryByRole("button", { name: /Seleccionar todos/u })).not.toBeInTheDocument();
    expect(screen.queryByRole("img", { name: /Buzo/u })).not.toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Nuevo talle para 2XL en Marrón" })).toBeInTheDocument();

    const negro = screen.getByRole("region", { name: "Color Negro" });
    const gris = screen.getByRole("region", { name: "Color Gris" });
    expect(within(negro).getByText("S")).toBeInTheDocument();
    expect(within(gris).getByText("S")).toBeInTheDocument();

    const sizeInput = screen.getByRole("textbox", { name: "Nuevo talle para S en Negro" });
    await user.clear(sizeInput);
    await user.type(sizeInput, "S/M");
    expect(within(negro).getByRole("textbox", { name: "Nuevo talle para S en Negro" })).toHaveValue("S/M");
    expect(within(gris).getByRole("textbox", { name: "Nuevo talle para S en Gris" })).toHaveValue("S/M");

    await user.click(screen.getByRole("button", { name: "Previsualizar cambio masivo" }));
    expect(screen.getByText("Vista previa lista: 2 variantes cambiarían de talle.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Cambiar masivamente/u })).toBeDisabled();
  });

  it("no permite trabajar con resultados parciales si una página falla", async () => {
    const user = userEvent.setup();
    const loadPageAction = vi.fn(async (_query: string, nextPage: number) =>
      nextPage === 1
        ? { ok: true as const, data: page1 }
        : { ok: false as const, message: "Error al consultar página 2" },
    );

    render(<TiendanubeSizeRenameView loadPageAction={loadPageAction} />);
    await user.click(screen.getByRole("button", { name: "Buscar todos" }));
    expect(await screen.findByText("Error al consultar página 2")).toBeInTheDocument();
    expect(screen.queryByText(/Resultados completos/u)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Previsualizar cambio masivo" }))
      .not.toBeInTheDocument();
  });
});
