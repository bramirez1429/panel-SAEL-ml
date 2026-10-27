import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { TiendanubeProductsPage } from "@/modules/tiendanube/domain/tiendanube-products.model";
import { TiendanubeSizeRenameView } from "./tiendanube-size-rename-view.client";

afterEach(cleanup);

const firstPage: TiendanubeProductsPage = {
  page: 1,
  pageSize: 100,
  hasMore: false,
  total: 1,
  products: [{
    id: "p1",
    name: "Buzo de mujer",
    imageUrl: "https://example.com/buzo.jpg",
    status: "visible",
    tags: ["buzos"],
    variants: [
      { id: "v1", size: "40", color: "Negro", sku: "B-40", stock: 10, price: 45000, promotionalPrice: null },
      { id: "v2", size: "42", color: "Negro", sku: "B-42", stock: 8, price: 45000, promotionalPrice: null },
    ],
  }],
};

describe("TiendanubeSizeRenameView", () => {
  it("busca buzos y simula cambios globales sin escribir en Tiendanube", async () => {
    const user = userEvent.setup();
    const loadPageAction = vi.fn().mockResolvedValue({ ok: true, data: firstPage });
    render(<TiendanubeSizeRenameView loadPageAction={loadPageAction} />);

    expect(loadPageAction).not.toHaveBeenCalled();
    expect(screen.getByText("Etapa 1 — Solo lectura y simulación")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Buscar" }));
    expect(await screen.findByText("Buzo de mujer")).toBeInTheDocument();
    expect(loadPageAction).toHaveBeenCalledWith("buzo", 1);
    expect(screen.getByText("40")).toBeInTheDocument();
    expect(screen.getByText("42")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Seleccionar todos los cargados" }));
    await user.clear(screen.getByRole("textbox", { name: "Nuevo talle para 40" }));
    await user.type(screen.getByRole("textbox", { name: "Nuevo talle para 40" }), "S/M");
    await user.click(screen.getByRole("button", { name: "Previsualizar cambios de talles" }));

    const preview = screen.getByText("Vista previa — Sin aplicar cambios").closest(".ant-card");
    expect(preview).not.toBeNull();
    expect(within(preview as HTMLElement).getByText("S/M")).toBeInTheDocument();
    expect(screen.getByText("Simulación solamente: no se modificó ningún producto.")).toBeInTheDocument();
    expect(loadPageAction).toHaveBeenCalledTimes(1);
  });
});
