import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { TiendanubeProductsPage } from "@/modules/tiendanube/domain/tiendanube-products.model";
import { TiendanubeSizeRenameView } from "./tiendanube-size-rename-view.client";

afterEach(cleanup);

function page(
  pageNumber: number,
  hasMore: boolean,
  products: TiendanubeProductsPage["products"],
): TiendanubeProductsPage {
  return { page: pageNumber, pageSize: 100, hasMore, products };
}

const page1 = page(1, true, [
  {
    id: "1001", name: "Buzo mujer negro", status: "visible",
    imageUrl: null, tags: [],
    variants: [
      { id: "5001", size: "S", color: "Negro", sku: "N-S", stock: 0, price: 50, promotionalPrice: null },
      { id: "5002", size: "M", color: "Negro", sku: "N-M", stock: 2, price: 50, promotionalPrice: null },
    ],
  },
  {
    id: "1002", name: "Buzo escondido", status: "hidden",
    imageUrl: null, tags: [],
    variants: [{ id: "5003", size: "2XL", color: "Gris", sku: null, stock: 0, price: 50, promotionalPrice: null }],
  },
]);

const page2 = page(2, false, [{
  id: "1004", name: "Buzo mujer gris", status: "visible",
  imageUrl: null, tags: [],
  variants: [
    { id: "5004", size: "S", color: "Gris", sku: "G-S", stock: 0, price: 55, promotionalPrice: null },
    { id: "5005", size: "L", color: "Gris", sku: "G-L", stock: 0, price: 55, promotionalPrice: null, visible: false },
  ],
}]);

describe("Stock masivo por talle", () => {
  it("muestra talles únicos de todo el catálogo visible e inputs vacíos", async () => {
    const user = userEvent.setup();
    const loadPageAction = vi.fn(async (_query: string, number: number) => ({
      ok: true as const, data: number === 1 ? page1 : page2,
    }));
    const applyStockBatchAction = vi.fn();
    render(<TiendanubeSizeRenameView loadPageAction={loadPageAction}
      applyStockBatchAction={applyStockBatchAction} checkSizeStockReadyAction={() => Promise.resolve(true)} />);

    await user.click(screen.getByRole("button", { name: "Buscar todos" }));
    expect(await screen.findByText('Talles únicos de "buzo de mujer"')).toBeInTheDocument();
    expect(loadPageAction).toHaveBeenCalledTimes(2);
    expect(screen.getByRole("spinbutton", { name: "Stock nuevo para talle S" })).toHaveValue(null);
    expect(screen.queryByRole("spinbutton", { name: "Stock nuevo para talle 2XL" })).not.toBeInTheDocument();
    expect(screen.queryByRole("spinbutton", { name: "Stock nuevo para talle L" })).not.toBeInTheDocument();
    expect(screen.getAllByText("S")).toHaveLength(1);
    expect(screen.getByText("Gris")).toBeInTheDocument();
    expect(screen.getByText("Negro")).toBeInTheDocument();
    expect(applyStockBatchAction).not.toHaveBeenCalled();

    await user.type(screen.getByRole("spinbutton", { name: "Stock nuevo para talle S" }), "7");
    await user.click(screen.getByRole("button", { name: "Cambiar stock masivamente" }));
    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText(/2 variantes visibles/u)).toBeInTheDocument();
    expect(applyStockBatchAction).not.toHaveBeenCalled();
    await user.click(within(dialog).getByRole("button", { name: "Cancelar" }));
    expect(applyStockBatchAction).not.toHaveBeenCalled();
  });

  it("rechaza resultados parciales y no habilita escritura", async () => {
    const user = userEvent.setup();
    const loadPageAction = vi.fn(async (_term: string, number: number) =>
      number === 1
        ? { ok: true as const, data: page1 }
        : { ok: false as const, message: "Página 2 falló" },
    );
    const applyStockBatchAction = vi.fn();
    render(<TiendanubeSizeRenameView loadPageAction={loadPageAction}
      applyStockBatchAction={applyStockBatchAction} checkSizeStockReadyAction={() => Promise.resolve(true)} />);
    await user.click(screen.getByRole("button", { name: "Buscar todos" }));
    expect(await screen.findByText("Página 2 falló")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Cambiar stock masivamente" })).not.toBeInTheDocument();
    expect(applyStockBatchAction).not.toHaveBeenCalled();
  });

  it("aplica únicamente luego de confirmación, solo variantes visibles, y vuelve a consultar", async () => {
    const user = userEvent.setup();
    const loadPageAction = vi.fn(async (_term: string, number: number) => ({
      ok: true as const, data: number === 1 ? page1 : page2,
    }));
    const applyStockBatchAction = vi.fn().mockResolvedValue({
      ok: true, updatedVariantIds: ["5001", "5004"], failedVariantIds: [],
    });
    render(<TiendanubeSizeRenameView loadPageAction={loadPageAction}
      applyStockBatchAction={applyStockBatchAction} checkSizeStockReadyAction={() => Promise.resolve(true)} />);
    await user.click(screen.getByRole("button", { name: "Buscar todos" }));
    await screen.findByText('Talles únicos de "buzo de mujer"');
    await user.type(screen.getByRole("spinbutton", { name: "Stock nuevo para talle S" }), "7");
    await user.click(screen.getByRole("button", { name: "Cambiar stock masivamente" }));
    const dialog = screen.getByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: "Confirmar y actualizar" }));
    expect(await screen.findByText(/Stock global actualizado y verificado/u)).toBeInTheDocument();
    expect(applyStockBatchAction).toHaveBeenCalledTimes(1);
    expect(applyStockBatchAction).toHaveBeenCalledWith([
      { productId: "1001", variantId: "5001", size: "S", expectedStock: 0, stock: 7 },
      { productId: "1004", variantId: "5004", size: "S", expectedStock: 0, stock: 7 },
    ]);
    expect(loadPageAction).toHaveBeenCalledTimes(4);
  });
});
