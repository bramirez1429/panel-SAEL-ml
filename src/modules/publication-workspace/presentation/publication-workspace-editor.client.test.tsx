import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { PublicationWorkspaceItem } from "../domain/publication-workspace.model";
import { PublicationWorkspaceEditor, type GetTiendanubeProductByMlAction } from "./publication-workspace-editor.client";

const publication: PublicationWorkspaceItem = {
  imageUrl: null,
  thumbnailUrl: null,
  title: "Remera original",
  itemId: "MLA2904936662",
  familyId: null,
  model: "SHARED",
  sku: "SKU-1",
  status: "active",
  stock: 12,
  sold: 7,
  price: 45_000,
  standardPrice: 45_000,
  regularPrice: 56_250,
  listingTypeId: "gold_special",
  currency: "ARS",
  hasActivePromotion: true,
  promotionDiscountPercent: 20,
  installmentLabel: "6 cuotas",
};

const update = vi.fn(async (input) => ({
  ok: true as const,
  confirmed: { sku: input.draft.sku, stock: input.draft.stock },
}));
const updateStatus = vi.fn().mockResolvedValue({ ok: true, confirmed: "active" });
const updateTitle = vi.fn(async ({ title }) => ({ ok: true as const, title }));
const writeText = vi.fn().mockResolvedValue(undefined);

beforeEach(() => {
  update.mockClear();
  updateStatus.mockClear();
  updateTitle.mockClear();
  writeText.mockClear();
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: { writeText },
  });
});
afterEach(cleanup);

describe("PublicationWorkspaceEditor", () => {
  it("muestra precio, cuotas, promoción y vendidos reales", () => {
    renderEditor();

    expect(screen.getByText("$ 45.000")).toBeInTheDocument();
    expect(screen.getByText("6 cuotas")).toBeInTheDocument();
    expect(screen.getByText("20% OFF")).toBeInTheDocument();
    expect(screen.getByText("7")).toBeInTheDocument();
  });

  it("muestra Sin promoción cuando el MLA no tiene una activa", () => {
    render(
      <PublicationWorkspaceEditor
        publication={{ ...publication, hasActivePromotion: false, promotionDiscountPercent: null }}
        onSave={update}
        onStatusChange={updateStatus}
        onTitleSave={updateTitle}
      />,
    );

    expect(screen.getByText("Sin promoción")).toBeInTheDocument();
  });

  it("copia el MLA", async () => {
    const user = userEvent.setup();
    const clipboardWrite = vi.spyOn(navigator.clipboard, "writeText");
    renderEditor();
    await user.click(screen.getByRole("button", { name: "Copiar MLA MLA2904936662" }));
    expect(clipboardWrite).toHaveBeenCalledWith("MLA2904936662");
    expect(await screen.findByText("MLA copiado")).toBeInTheDocument();
  });

  it("guarda stock al salir del campo y no guarda si no cambió", async () => {
    renderEditor();
    const stock = screen.getByLabelText("Stock de MLA2904936662");
    fireEvent.blur(stock);
    expect(update).not.toHaveBeenCalled();

    fireEvent.change(stock, { target: { value: "8" } });
    fireEvent.blur(stock);
    await waitFor(() => expect(update).toHaveBeenCalledTimes(1));
    expect(update.mock.calls[0]?.[0].draft.stock).toBe(8);
  });

  it("guarda SKU al salir del campo y no guarda si no cambió", async () => {
    renderEditor();
    const sku = screen.getByLabelText("SKU de MLA2904936662");
    fireEvent.blur(sku);
    expect(update).not.toHaveBeenCalled();

    fireEvent.change(sku, { target: { value: "SKU-2" } });
    fireEvent.blur(sku);
    await waitFor(() => expect(update).toHaveBeenCalledTimes(1));
    expect(update.mock.calls[0]?.[0].draft.sku).toBe("SKU-2");
  });

  it("el lápiz habilita el título y onBlur lo guarda", async () => {
    const user = userEvent.setup();
    renderEditor();
    await user.click(screen.getByRole("button", { name: "Editar título" }));
    const title = screen.getByLabelText("Editar título");
    await user.clear(title);
    await user.type(title, "Remera nueva");
    fireEvent.blur(title);
    await waitFor(() => expect(updateTitle).toHaveBeenCalledWith({ target: { type: "publication", itemId: publication.itemId }, title: "Remera nueva" }));
    expect(await screen.findByText("Remera nueva")).toBeInTheDocument();
  });

  it("Enter guarda el título y Escape cancela sin request", async () => {
    const user = userEvent.setup();
    renderEditor();
    await user.click(screen.getByRole("button", { name: "Editar título" }));
    await user.clear(screen.getByLabelText("Editar título"));
    await user.type(screen.getByLabelText("Editar título"), "Título con Enter{Enter}");
    await waitFor(() => expect(updateTitle).toHaveBeenCalledTimes(1));

    await user.click(screen.getByRole("button", { name: "Editar título" }));
    await user.clear(screen.getByLabelText("Editar título"));
    await user.type(screen.getByLabelText("Editar título"), "Cancelar{Escape}");
    expect(updateTitle).toHaveBeenCalledTimes(1);
    expect(screen.getByText("Título con Enter")).toBeInTheDocument();
  });

  it("restaura el valor anterior cuando falla el autoguardado", async () => {
    update.mockResolvedValueOnce({ ok: false, message: "Falló", confirmed: {} } as never);
    renderEditor();
    const stock = screen.getByLabelText("Stock de MLA2904936662");
    fireEvent.change(stock, { target: { value: "3" } });
    fireEvent.blur(stock);
    await waitFor(() => expect(stock).toHaveValue("12"));
    expect(await screen.findByText("Falló")).toBeInTheDocument();
  });
  it("muestra un skeleton mientras carga los datos de Tiendanube", () => {
    const loadTiendanubeProduct: GetTiendanubeProductByMlAction = vi.fn(() => new Promise<Awaited<ReturnType<GetTiendanubeProductByMlAction>>>(() => undefined));
    const { container } = renderEditor({ getTiendanubeProductByMlAction: loadTiendanubeProduct });

    expect(container.querySelector(".ant-skeleton")).toBeInTheDocument();
  });

  it("muestra precio, stock y precio promocional reales de Tiendanube", async () => {
    const loadTiendanubeProduct = vi.fn().mockResolvedValue({
      ok: true as const,
      product: { linked: true, price: 47_000, stock: 5, promotionalPrice: 42_000 },
    });
    renderEditor({ getTiendanubeProductByMlAction: loadTiendanubeProduct });

    expect(await screen.findByLabelText("Precio TN")).toHaveValue("47000");
    expect(screen.getByLabelText("Stock TN")).toHaveValue("5");
    expect(screen.getByLabelText("Precio promocional TN")).toHaveValue("42000");
  });

  it("muestra No vinculado cuando Tiendanube no tiene el MLA asociado", async () => {
    const loadTiendanubeProduct = vi.fn().mockResolvedValue({
      ok: true as const,
      product: { linked: false, price: null, stock: null, promotionalPrice: null },
    });
    renderEditor({ getTiendanubeProductByMlAction: loadTiendanubeProduct });

    expect(await screen.findAllByText("No vinculado")).toHaveLength(3);
  });

  it("muestra un guion cuando un dato de Tiendanube es nulo", async () => {
    const loadTiendanubeProduct = vi.fn().mockResolvedValue({
      ok: true as const,
      product: { linked: true, price: null, stock: 5, promotionalPrice: null },
    });
    renderEditor({ getTiendanubeProductByMlAction: loadTiendanubeProduct });

    expect(await screen.findAllByPlaceholderText("—")).toHaveLength(2);
    expect(screen.getByLabelText("Stock TN")).toHaveValue("5");
  });
});

function renderEditor(props: Readonly<{ getTiendanubeProductByMlAction?: GetTiendanubeProductByMlAction }> = {}) {
  return render(
    <PublicationWorkspaceEditor
      publication={publication}
      onSave={update}
      onStatusChange={updateStatus}
      onTitleSave={updateTitle}
      titleTarget={{ type: "publication", itemId: publication.itemId }}
      {...props}
    />,
  );
}
