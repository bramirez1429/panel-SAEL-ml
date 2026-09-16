import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { PromotionRow } from "../domain/promotion.model";
import type { PromotionOption } from "../domain/promotions.repository";
import { PromotionBulkDeactivationLauncher } from "./promotion-bulk-deactivation-launcher.client";
import { PromotionBulkDeactivationModal } from "./promotion-bulk-deactivation-modal.client";
import type { PromotionDeactivationSelection } from "./promotion-deactivation-modal.client";
import { promotionDeactivationKey } from "./promotion-deactivation.helpers";
import { resetPromotionGlobalStore, usePromotionGlobalStore } from "./promotion-global.store";

const mocks = vi.hoisted(() => ({ deactivate: vi.fn(), refresh: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mocks.refresh }),
}));
vi.mock("./deactivate-selected-promotion.action", () => ({
  deactivateSelectedPromotion: mocks.deactivate,
}));

describe("PromotionBulkDeactivationModal", () => {
  beforeEach(() => {
    resetPromotionGlobalStore();
    mocks.deactivate.mockReset();
    mocks.refresh.mockReset();
  });
  afterEach(cleanup);

  it("abre el modal desde la acción masiva y muestra solamente promociones removibles", async () => {
    const user = userEvent.setup();
    const publication = publicationRow(1);
    const active = removableOption(1, { name: "Activa" });
    usePromotionGlobalStore.getState().saveOptions(publication.itemId, [
      active,
      removableOption(2, { name: "Programada", status: "pending" }),
      removableOption(3, { name: "Sin permiso", canRemove: false }),
      removableOption(4, { name: "Candidata", status: "candidate", canApply: true }),
    ]);
    const key = promotionDeactivationKey(publication.itemId, active);
    render(<PromotionBulkDeactivationLauncher
      publications={[publication]}
      selectedForRemoval={{ [key]: { publication, option: active } }}
      onSuccessfulRemoval={vi.fn()}
    />);

    await user.click(screen.getByRole("button", { name: "Dejar de participar de 1 promoción" }));

    expect(screen.getByRole("dialog", { name: "Dejar de participar de promociones" })).toBeInTheDocument();
    expect(screen.getByText("Activa")).toBeInTheDocument();
    expect(screen.getByText("Programada")).toBeInTheDocument();
    expect(screen.queryByText("Sin permiso")).not.toBeInTheDocument();
    expect(screen.queryByText("Candidata")).not.toBeInTheDocument();
  });

  it("el checkbox individual actualiza contador, cantidad del botón y su estado", async () => {
    const user = userEvent.setup();
    renderModal(2);
    const submit = screen.getByRole("button", { name: "Dejar de participar de 0 promociones" });

    expect(screen.getByText("0 promociones seleccionadas")).toBeInTheDocument();
    expect(submit).toBeDisabled();
    await user.click(screen.getByRole("checkbox", { name: /Seleccionar Campaña 1 MLA1/ }));
    expect(screen.getByText("1 promociones seleccionadas")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Dejar de participar de 1 promociones" })).toBeEnabled();
  });

  it("Seleccionar todas marca todas y desmarcarlo limpia la selección", async () => {
    const user = userEvent.setup();
    renderModal(5);
    const master = screen.getByRole("checkbox", { name: "Seleccionar todas" });

    await user.click(master);
    expect(screen.getByText("5 promociones seleccionadas")).toBeInTheDocument();
    individualCheckboxes().forEach((checkbox) => expect(checkbox).toBeChecked());

    await user.click(master);
    expect(screen.getByText("0 promociones seleccionadas")).toBeInTheDocument();
    individualCheckboxes().forEach((checkbox) => expect(checkbox).not.toBeChecked());
  });

  it("la selección parcial deja el checkbox maestro indeterminado", async () => {
    const user = userEvent.setup();
    renderModal(3);

    await user.click(screen.getByRole("checkbox", { name: /Seleccionar Campaña 2 MLA2/ }));

    expect(screen.getByRole("checkbox", { name: "Seleccionar todas" })).toBePartiallyChecked();
  });

  it("muestra la confirmación dentro del mismo modal", async () => {
    const user = userEvent.setup();
    renderModal(2);
    await user.click(screen.getByRole("checkbox", { name: "Seleccionar todas" }));
    await user.click(screen.getByRole("button", { name: "Dejar de participar de 2 promociones" }));

    expect(screen.getAllByRole("dialog")).toHaveLength(1);
    expect(screen.getByText("¿Confirmás que querés dejar de participar de 2 promociones?")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Volver" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Confirmar" })).toBeInTheDocument();
  });

  it("ejecuta solamente las promociones seleccionadas", async () => {
    const user = userEvent.setup();
    mocks.deactivate.mockResolvedValue({ ok: true });
    const selections = deactivationSelections(3);
    render(<PromotionBulkDeactivationModal selections={selections} onClose={vi.fn()} />);

    await user.click(screen.getByRole("checkbox", { name: /Seleccionar Campaña 2 MLA2/ }));
    await confirmSelection(user, 1);

    expect(await screen.findByText("1 eliminadas · 0 con error")).toBeInTheDocument();
    expect(mocks.deactivate).toHaveBeenCalledTimes(1);
    expect(mocks.deactivate).toHaveBeenCalledWith({ itemId: "MLA2", option: selections[1]?.option });
  });

  it("ejecuta una por vez y muestra progreso", async () => {
    const user = userEvent.setup();
    let active = 0;
    let maximum = 0;
    const order: string[] = [];
    mocks.deactivate.mockImplementation(async ({ itemId }: Readonly<{ itemId: string }>) => {
      active += 1;
      maximum = Math.max(maximum, active);
      order.push(itemId);
      await Promise.resolve();
      active -= 1;
      return { ok: true };
    });
    renderModal(3);

    await selectAllAndConfirm(user, 3);

    expect(await screen.findByText("3 eliminadas · 0 con error")).toBeInTheDocument();
    expect(order).toEqual(["MLA1", "MLA2", "MLA3"]);
    expect(maximum).toBe(1);
  });

  it("protege contra doble submit y mantiene el modal bloqueado mientras procesa", async () => {
    const user = userEvent.setup();
    const resolvers: Array<(result: Readonly<{ ok: true }>) => void> = [];
    mocks.deactivate.mockImplementation(() => new Promise((resolve) => resolvers.push(resolve)));
    renderModal(2);
    await user.click(screen.getByRole("checkbox", { name: "Seleccionar todas" }));
    await user.click(screen.getByRole("button", { name: "Dejar de participar de 2 promociones" }));
    const confirm = screen.getByRole("button", { name: "Confirmar" });

    fireEvent.click(confirm);
    fireEvent.click(confirm);

    await waitFor(() => expect(mocks.deactivate).toHaveBeenCalledTimes(1));
    expect(screen.getByText("Procesando 1 de 2")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Confirmar" })).not.toBeInTheDocument();
    resolvers[0]?.({ ok: true });
    await waitFor(() => expect(mocks.deactivate).toHaveBeenCalledTimes(2));
    resolvers[1]?.({ ok: true });
    expect(await screen.findByText("2 eliminadas · 0 con error")).toBeInTheDocument();
  });

  it("si una falla continúa, muestra ambos grupos, conserva la fallida y refresca", async () => {
    const user = userEvent.setup();
    mocks.deactivate
      .mockResolvedValueOnce({ ok: true })
      .mockResolvedValueOnce({ ok: false, message: "Mercado Libre rechazó la baja" })
      .mockResolvedValueOnce({ ok: true });
    const selections = deactivationSelections(3);
    selections.forEach(({ publication, option }) => (
      usePromotionGlobalStore.getState().saveOptions(publication.itemId, [option])
    ));
    render(<PromotionBulkDeactivationModal selections={selections} onClose={vi.fn()} />);

    await selectAllAndConfirm(user, 3);

    expect(await screen.findByText("2 eliminadas · 1 con error")).toBeInTheDocument();
    expect(screen.getByText("ELIMINADAS CORRECTAMENTE")).toBeInTheDocument();
    expect(screen.getByText("NO SE PUDIERON ELIMINAR")).toBeInTheDocument();
    expect(screen.getByText("Mercado Libre rechazó la baja")).toBeInTheDocument();
    expect(mocks.deactivate).toHaveBeenCalledTimes(3);
    expect(mocks.refresh).toHaveBeenCalledOnce();
    expect(usePromotionGlobalStore.getState().optionsByItem.MLA1).toBeUndefined();
    expect(usePromotionGlobalStore.getState().optionsByItem.MLA2).toBeDefined();
    expect(usePromotionGlobalStore.getState().optionsByItem.MLA3).toBeUndefined();
    expect(screen.getByRole("button", { name: "Listo" })).toBeInTheDocument();
  });

  it("procesa secuencialmente 50 promociones", async () => {
    const user = userEvent.setup();
    mocks.deactivate.mockResolvedValue({ ok: true });
    renderModal(50);

    await selectAllAndConfirm(user, 50);

    expect(await screen.findByText("50 eliminadas · 0 con error")).toBeInTheDocument();
    expect(mocks.deactivate).toHaveBeenCalledTimes(50);
    expect(mocks.deactivate.mock.calls.map((call) => call[0].itemId)).toEqual(
      Array.from({ length: 50 }, (_, index) => `MLA${index + 1}`),
    );
  });
});

function renderModal(count: number): void {
  render(<PromotionBulkDeactivationModal selections={deactivationSelections(count)} onClose={vi.fn()} />);
}

function individualCheckboxes(): HTMLElement[] {
  return screen.getAllByRole("checkbox").filter((checkbox) => (
    checkbox.getAttribute("aria-label") !== "Seleccionar todas"
  ));
}

async function confirmSelection(
  user: ReturnType<typeof userEvent.setup>,
  count: number,
): Promise<void> {
  await user.click(screen.getByRole("button", { name: `Dejar de participar de ${count} promociones` }));
  await user.click(screen.getByRole("button", { name: "Confirmar" }));
}

async function selectAllAndConfirm(
  user: ReturnType<typeof userEvent.setup>,
  count: number,
): Promise<void> {
  await user.click(screen.getByRole("checkbox", { name: "Seleccionar todas" }));
  await confirmSelection(user, count);
}

function deactivationSelections(count: number): readonly PromotionDeactivationSelection[] {
  return Array.from({ length: count }, (_, index) => ({
    publication: publicationRow(index + 1),
    option: removableOption(index + 1),
  }));
}

function publicationRow(index: number): PromotionRow {
  return {
    itemId: `MLA${index}`,
    familyId: `F-${index}`,
    title: `Publicación ${index}`,
    thumbnail: null,
    sku: null,
    stock: null,
    freeShipping: null,
    installmentLabel: null,
    productGroup: "WOMEN_TSHIRT",
    price: 20_000,
    currentPromotion: null,
    hasActivePromotion: true,
    availablePromotionsCount: 0,
    promotionStatus: "ACTIVE",
  };
}

function removableOption(index: number, overrides: Partial<PromotionOption> = {}): PromotionOption {
  return {
    id: `P-${index}`,
    offerId: null,
    type: "DEAL",
    name: `Campaña ${index}`,
    status: "started",
    originalPrice: 20_000,
    promotionPrice: 15_000,
    minPromotionPrice: null,
    maxPromotionPrice: null,
    suggestedPromotionPrice: null,
    requiresPriceSelection: false,
    discountPercent: null,
    sellerDiscountAmount: null,
    mercadoLibreBaseContributionAmount: null,
    mercadoLibreBoostAmount: null,
    mercadoLibreContributionAmount: null,
    estimatedNetAmount: null,
    suggestedEstimatedNetAmount: null,
    startDate: null,
    finishDate: null,
    canApply: false,
    canRemove: true,
    saleEstimate: null,
    ...overrides,
  };
}
