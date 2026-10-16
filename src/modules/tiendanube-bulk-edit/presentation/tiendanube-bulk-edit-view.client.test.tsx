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
    await waitFor(() => expect(previewAction).toHaveBeenCalledWith({ categoryId: 1, price: 45_000 }));
    expect(screen.getByRole("button", { name: "Confirmar actualización global" })).toBeInTheDocument();
  });

  it("recupera errores del trabajo y permite reintentar sólo los fallidos", async () => {
    const user = userEvent.setup();
    const retryFailuresAction = vi.fn().mockResolvedValue(job());
    render(<TiendanubeBulkEditView {...actions({ getActiveAction: vi.fn().mockResolvedValue(job()), getFailuresAction: vi.fn().mockResolvedValue({ total: 1, items: [{ id: "failure-1", productName: "Remera", tiendanubeProductId: "100", variantId: "200", sku: null, size: "M", color: "Negro", field: "stock", message: "No se pudo modificar el stock del talle M, color negro.", technicalDetail: "rate_limit", status: "PENDING_RETRY", adminUrl: null }] }), retryFailuresAction })} categories={[]} categoryError={null} />);
    expect(await screen.findByText("Productos que no se pudieron actualizar")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Reintentar solamente los fallidos" }));
    await waitFor(() => expect(retryFailuresAction).toHaveBeenCalledWith("job-1"));
  });
});

function actions(overrides: Partial<ComponentProps<typeof TiendanubeBulkEditView>> = {}) {
  return {
    getActiveAction: vi.fn().mockResolvedValue(null),
    getCategorySummaryAction: vi.fn().mockResolvedValue(summary()),
    getFailuresAction: vi.fn().mockResolvedValue({ items: [], total: 0 }),
    getJobAction: vi.fn(),
    previewAction: vi.fn(),
    retryFailuresAction: vi.fn(),
    startAction: vi.fn(),
    ...overrides,
  };
}

function summary(): TiendanubeBulkEditCategorySummary {
  return { productCount: 1, variantCount: 1, locations: [], products: [{ id: "p1", name: "Remera", variants: [] }] };
}
function emptySummary(): TiendanubeBulkEditCategorySummary { return { ...summary(), productCount: 0, variantCount: 0, products: [] }; }
function preview(): TiendanubeBulkEditPreview { return { id: "preview-1", categoryId: 1, productCount: 1, variantCount: 1, changes: { price: 45_000 }, preservedFields: ["stock", "promotionalPrice"], incompatibilities: [] }; }
function job() { return { id: "job-1", status: "COMPLETED_WITH_ERRORS" as const, totalProducts: 1, totalVariants: 1, updatedVariants: 0, failedVariants: 1, pendingVariants: 0 }; }
