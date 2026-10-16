import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ComponentProps } from "react";

import type { TiendanubeBulkEditCategorySummary, TiendanubeBulkEditPreview } from "../domain/tiendanube-bulk-edit.model";
import { TiendanubeBulkEditView } from "./tiendanube-bulk-edit-view.client";

describe("TiendanubeBulkEditView", () => {
  afterEach(cleanup);

  it("mantiene visible y clickeable la previsualización sin categoría", async () => {
    const user = userEvent.setup();
    render(<TiendanubeBulkEditView {...actions()} categories={[]} categoryError={null} />);
    const button = screen.getByRole("button", { name: "Previsualizar cambios" });
    expect(button).toBeEnabled();
    await user.click(button);
    expect(screen.getByText("Seleccioná una categoría")).toBeInTheDocument();
  });

  it("muestra un error cuando todos los campos están vacíos", async () => {
    const user = userEvent.setup();
    render(<TiendanubeBulkEditView {...actions()} categories={[{ id: 1, name: "Remeras", parentId: null }]} categoryError={null} />);
    await user.click(screen.getByRole("combobox"));
    await user.click(await screen.findByText("Remeras"));
    await user.click(screen.getByRole("button", { name: "Previsualizar cambios" }));
    expect(await screen.findByText("Completá al menos un campo.")).toBeInTheDocument();
  });

  it("muestra el estado vacío cuando la categoría no tiene productos", async () => {
    const user = userEvent.setup();
    render(<TiendanubeBulkEditView {...actions({ getCategorySummaryAction: vi.fn().mockResolvedValue(emptySummary()) })} categories={[{ id: 1, name: "Remeras", parentId: null }]} categoryError={null} />);
    await user.click(screen.getByRole("combobox"));
    await user.click(await screen.findByText("Remeras"));
    expect(await screen.findByText("No hay productos en esta categoría.")).toBeInTheDocument();
  });

  it("envía los tres valores escritos en los InputNumber para la previsualización", async () => {
    const user = userEvent.setup();
    const previewAction = vi.fn().mockResolvedValue(preview());
    render(<TiendanubeBulkEditView {...actions({ previewAction })} categories={[{ id: 1, name: "Remeras", parentId: null }]} categoryError={null} />);
    await user.click(screen.getByRole("combobox"));
    await user.click(await screen.findByText("Remeras"));
    await user.type(screen.getByPlaceholderText("$45.000"), "36499");
    await user.type(screen.getByPlaceholderText("$31.999"), "31024");
    await user.type(screen.getByPlaceholderText("4 unidades"), "3");
    expect(screen.getByRole("button", { name: "Previsualizar cambios" })).toBeEnabled();
    await user.click(screen.getByRole("button", { name: "Previsualizar cambios" }));
    await waitFor(() => expect(previewAction).toHaveBeenCalledWith({ categoryId: "1", changes: { price: "36499", promotionalPrice: "31024", stock: 3 } }));
    expect(screen.getByText("Confirmá para iniciar la actualización real en Tiendanube.")).toBeInTheDocument();
  });

  it("exige seleccionar un depósito al modificar stock cuando hay más de uno", async () => {
    const user = userEvent.setup();
    const previewAction = vi.fn().mockResolvedValue(preview());
    const multipleLocations = { ...summary(), locations: [{ id: "location-1" }, { id: "location-2" }] };
    render(<TiendanubeBulkEditView {...actions({ getCategorySummaryAction: vi.fn().mockResolvedValue(multipleLocations), previewAction })} categories={[{ id: 1, name: "Remeras", parentId: null }]} categoryError={null} />);
    await user.click(screen.getByRole("combobox"));
    await user.click(await screen.findByText("Remeras"));
    await user.type(screen.getByPlaceholderText("4 unidades"), "0");
    await user.click(screen.getByRole("combobox", { name: "Depósito para stock" }));
    await user.click(await screen.findByText("location-2"));
    await user.click(screen.getByRole("button", { name: "Previsualizar cambios" }));
    await waitFor(() => expect(previewAction).toHaveBeenCalledWith({ categoryId: "1", changes: { stock: 0, locationId: "location-2" } }));
  });

  it("no permite confirmar una previsualización con incompatibilidades", async () => {
    const user = userEvent.setup();
    const incompatiblePreview = preview({ incompatibilities: [{ variantId: "v1", reason: "Sin depósito compatible" }] });
    render(<TiendanubeBulkEditView {...actions({ previewAction: vi.fn().mockResolvedValue(incompatiblePreview) })} categories={[{ id: 1, name: "Remeras", parentId: null }]} categoryError={null} />);
    await user.click(screen.getByRole("combobox"));
    await user.click(await screen.findByText("Remeras"));
    await user.type(screen.getByPlaceholderText("$45.000"), "36499");
    await user.click(screen.getByRole("button", { name: "Previsualizar cambios" }));
    expect(await screen.findByRole("button", { name: "Confirmar y aplicar cambios" })).toBeDisabled();
  });

  it("muestra el error del resumen y permite reintentar la categoría", async () => {
    const user = userEvent.setup();
    const getCategorySummaryAction = vi.fn().mockResolvedValue({ ok: false as const, message: "Tiendanube no respondió." });
    render(<TiendanubeBulkEditView {...actions({ getCategorySummaryAction })} categories={[{ id: 1, name: "Remeras", parentId: null }]} categoryError={null} />);

    await user.click(screen.getByRole("combobox"));
    await user.click(await screen.findByText("Remeras"));

    expect(await screen.findByText("Tiendanube no respondió.")).toBeInTheDocument();
    expect(screen.getByText("No se puede previsualizar hasta cargar el resumen real de productos y variantes.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Previsualizar cambios" })).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "Reintentar cargar categoría" }));
    await waitFor(() => expect(getCategorySummaryAction).toHaveBeenCalledTimes(2));
  });

  it("permite previsualizar aunque exista un trabajo QUEUED antiguo", async () => {
    const user = userEvent.setup();
    render(<TiendanubeBulkEditView {...actions({ getActiveAction: vi.fn().mockResolvedValue(queuedJob()) })} categories={[{ id: 1, name: "Remeras", parentId: null }]} categoryError={null} />);

    expect(await screen.findByText("Estado actual: QUEUED.")).toBeInTheDocument();
    await user.click(screen.getByRole("combobox"));
    await user.click(await screen.findByText("Remeras"));
    await user.type(screen.getByPlaceholderText("$45.000"), "45000");

    expect(screen.getByRole("button", { name: "Previsualizar cambios" })).toBeEnabled();
  });

  it("muestra un error visible cuando falla la previsualización", async () => {
    const user = userEvent.setup();
    render(<TiendanubeBulkEditView {...actions({ previewAction: vi.fn().mockResolvedValue({ ok: false as const, message: "No se pudo crear el snapshot." }) })} categories={[{ id: 1, name: "Remeras", parentId: null }]} categoryError={null} />);

    await user.click(screen.getByRole("combobox"));
    await user.click(await screen.findByText("Remeras"));
    await user.type(screen.getByPlaceholderText("$45.000"), "45000");
    await user.click(screen.getByRole("button", { name: "Previsualizar cambios" }));

    expect(await screen.findByText("No se pudo crear el snapshot.")).toBeInTheDocument();
  });
});

function actions(overrides: Partial<ComponentProps<typeof TiendanubeBulkEditView>> = {}) {
  return {
    getActiveAction: vi.fn().mockResolvedValue(null),
    getCategorySummaryAction: vi.fn().mockResolvedValue(summary()),
    previewAction: vi.fn(),
    createJobAction: vi.fn(),
    getJobAction: vi.fn().mockResolvedValue(completedJob()),
    getFailuresAction: vi.fn().mockResolvedValue([]),
    retryFailuresAction: vi.fn(),
    ...overrides,
  };
}

function summary(): TiendanubeBulkEditCategorySummary {
  return { categoryId: "1", productCount: 1, variantCount: 1, locations: [], products: [{ id: "p1", name: "Remera", variants: [] }] };
}
function emptySummary(): TiendanubeBulkEditCategorySummary { return { ...summary(), productCount: 0, variantCount: 0, products: [] }; }
function preview(overrides: Partial<TiendanubeBulkEditPreview> = {}): TiendanubeBulkEditPreview { return { snapshotId: "preview-1", categoryId: "1", productCount: 1, variantCount: 1, products: [], locations: [], changes: { price: "45000" }, preservedFields: ["stock", "promotionalPrice"], incompatibilities: [], generatedAt: "2026-10-16T12:00:00.000Z", expiresAt: "2026-10-16T12:30:00.000Z", ...overrides }; }
function queuedJob() { return { id: "job-1", status: "QUEUED" as const, totalProducts: 1, totalVariants: 1, completedVariants: 0, failedVariants: 0, pendingVariants: 1 }; }
function completedJob() { return { id: "job-1", status: "COMPLETED" as const, totalProducts: 1, totalVariants: 1, completedVariants: 1, failedVariants: 0, pendingVariants: 0 }; }
