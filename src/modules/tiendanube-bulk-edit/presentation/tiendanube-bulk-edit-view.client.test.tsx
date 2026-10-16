import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ComponentProps } from "react";

import type { TiendanubeBulkEditCategorySummary, TiendanubeBulkEditPreview } from "../domain/tiendanube-bulk-edit.model";
import { TiendanubeBulkEditView } from "./tiendanube-bulk-edit-view.client";

describe("TiendanubeBulkEditView", () => {
  afterEach(cleanup);

  it("no permite previsualizar sin categoría ni valores cargados", () => {
    render(<TiendanubeBulkEditView {...actions()} categories={[]} categoryError={null} />);
    expect(screen.getByRole("button", { name: "Previsualizar cambios" })).toBeDisabled();
  });

  it("muestra el estado vacío cuando la categoría no tiene productos", async () => {
    const user = userEvent.setup();
    render(<TiendanubeBulkEditView {...actions({ getCategorySummaryAction: vi.fn().mockResolvedValue(emptySummary()) })} categories={[{ id: 1, name: "Remeras", parentId: null }]} categoryError={null} />);
    await user.click(screen.getByRole("combobox"));
    await user.click(await screen.findByText("Remeras"));
    expect(await screen.findByText("No hay productos en esta categoría.")).toBeInTheDocument();
  });

  it("envía únicamente los campos completados para la previsualización", async () => {
    const user = userEvent.setup();
    const previewAction = vi.fn().mockResolvedValue(preview());
    render(<TiendanubeBulkEditView {...actions({ previewAction })} categories={[{ id: 1, name: "Remeras", parentId: null }]} categoryError={null} />);
    await user.click(screen.getByRole("combobox"));
    await user.click(await screen.findByText("Remeras"));
    const input = screen.getByPlaceholderText("$45.000");
    await user.type(input, "45000");
    await user.click(screen.getByRole("button", { name: "Previsualizar cambios" }));
    await waitFor(() => expect(previewAction).toHaveBeenCalledWith({ categoryId: "1", changes: { price: "45000" } }));
    expect(screen.getByText("La previsualización está disponible. La aplicación de cambios se habilitará cuando finalice el procesamiento masivo.")).toBeInTheDocument();
  });
});

function actions(overrides: Partial<ComponentProps<typeof TiendanubeBulkEditView>> = {}) {
  return {
    getActiveAction: vi.fn().mockResolvedValue(null),
    getCategorySummaryAction: vi.fn().mockResolvedValue(summary()),
    previewAction: vi.fn(),
    ...overrides,
  };
}

function summary(): TiendanubeBulkEditCategorySummary {
  return { categoryId: "1", productCount: 1, variantCount: 1, locations: [], products: [{ id: "p1", name: "Remera", variants: [] }] };
}
function emptySummary(): TiendanubeBulkEditCategorySummary { return { ...summary(), productCount: 0, variantCount: 0, products: [] }; }
function preview(): TiendanubeBulkEditPreview { return { id: "preview-1", categoryId: "1", productCount: 1, variantCount: 1, products: [], locations: [], changes: { price: "45000" }, preservedFields: ["stock", "promotionalPrice"], incompatibilities: [], generatedAt: "2026-10-16T12:00:00.000Z", expiresAt: "2026-10-16T12:30:00.000Z" }; }
