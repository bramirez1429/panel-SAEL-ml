import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { PromotionOption } from "../domain/promotions.repository";
import { promotionSelectionKey, resetPromotionGlobalStore, usePromotionGlobalStore, type SelectedPromotion } from "./promotion-global.store";
import { PromotionSelectionSummary } from "./promotion-selection-summary.client";

const mocks = vi.hoisted(() => ({ apply: vi.fn(), refresh: vi.fn() }));

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: mocks.refresh }) }));
vi.mock("./apply-selected-promotion.action", () => ({ applySelectedPromotion: mocks.apply }));

describe("aplicación masiva secuencial", () => {
  beforeEach(() => {
    resetPromotionGlobalStore();
    mocks.apply.mockReset();
    mocks.refresh.mockReset();
  });
  afterEach(cleanup);

  it("ejecuta 1, 2 y 3 en orden, sin solaparlas, y refresca al finalizar", async () => {
    const user = userEvent.setup();
    let active = 0;
    let maximum = 0;
    const order: string[] = [];
    mocks.apply.mockImplementation(async ({ itemId }: Readonly<{ itemId: string }>) => {
      active += 1;
      maximum = Math.max(maximum, active);
      order.push(itemId);
      await Promise.resolve();
      active -= 1;
      return { ok: true };
    });
    select(selection("MLA1"), selection("MLA2"), selection("MLA3"));
    render(<PromotionSelectionSummary />);

    await openAndStart(user, 3);
    expect(await screen.findByText("Proceso completado")).toBeInTheDocument();
    expect(order).toEqual(["MLA1", "MLA2", "MLA3"]);
    expect(maximum).toBe(1);
    expect(mocks.refresh).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "Listo" })).toBeInTheDocument();
  });

  it("continúa después de un error y separa éxitos y fallas", async () => {
    const user = userEvent.setup();
    mocks.apply
      .mockResolvedValueOnce({ ok: true })
      .mockResolvedValueOnce({ ok: false, message: "Mercado Libre rechazó la promoción" })
      .mockResolvedValueOnce({ ok: true });
    const first = selection("MLA1");
    const failed = selection("MLA2");
    const third = selection("MLA3");
    select(first, failed, third);
    [first, failed, third].forEach((value) => usePromotionGlobalStore.getState().saveOptions(value.itemId, [value.option]));
    render(<PromotionSelectionSummary />);

    await openAndStart(user, 3);
    expect(await screen.findByText("Proceso completado")).toBeInTheDocument();
    expect(screen.getByText("2 correctas · 1 con error")).toBeInTheDocument();
    expect(screen.getByText("APLICADAS / PROGRAMADAS")).toBeInTheDocument();
    expect(screen.getByText("NO SE PUDIERON APLICAR")).toBeInTheDocument();
    expect(screen.getByText("Mercado Libre rechazó la promoción")).toBeInTheDocument();
    expect(mocks.apply).toHaveBeenCalledTimes(3);
    const remaining = usePromotionGlobalStore.getState().selections;
    expect(remaining[first.key]).toBeUndefined();
    expect(remaining[third.key]).toBeUndefined();
    expect(remaining[failed.key]).toBeDefined();
    expect(usePromotionGlobalStore.getState().optionsByItem).toEqual({});
  });

  it("actualiza el progreso y no inicia otra cola con doble submit", async () => {
    const user = userEvent.setup();
    const resolvers: Array<(result: Readonly<{ ok: true }>) => void> = [];
    mocks.apply.mockImplementation(() => new Promise((resolve) => resolvers.push(resolve)));
    select(selection("MLA1"), selection("MLA2"), selection("MLA3"));
    render(<PromotionSelectionSummary />);
    await user.click(screen.getByRole("button", { name: "Participar en las seleccionadas" }));
    const start = screen.getByRole("button", { name: "Participar en 3 promociones" });
    fireEvent.click(start);
    fireEvent.click(start);

    await waitFor(() => expect(mocks.apply).toHaveBeenCalledTimes(1));
    expect(screen.getByText("Procesando 1 de 3")).toBeInTheDocument();
    expect(screen.getByText("0 de 3 procesadas")).toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "0");

    resolvers[0]?.({ ok: true });

    await waitFor(() => expect(mocks.apply).toHaveBeenCalledTimes(2));
    expect(screen.getByText("Procesando 2 de 3")).toBeInTheDocument();
    expect(screen.getByText("1 de 3 procesadas")).toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "33");

    resolvers[1]?.({ ok: true });

    await waitFor(() => expect(mocks.apply).toHaveBeenCalledTimes(3));
    expect(screen.getByText("Procesando 3 de 3")).toBeInTheDocument();
    expect(screen.getByText("2 de 3 procesadas")).toBeInTheDocument();
    resolvers[2]?.({ ok: true });
    expect(await screen.findByText("Proceso completado")).toBeInTheDocument();
  });

  it("valida mínimo y máximo antes de habilitar el lote", async () => {
    const user = userEvent.setup();
    select(selection("MLA1", option({ suggestedPromotionPrice: 250, minPromotionPrice: 100, maxPromotionPrice: 200 })));
    render(<PromotionSelectionSummary />);
    await user.click(screen.getByRole("button", { name: "Participar en las seleccionadas" }));
    const submit = screen.getByRole("button", { name: "Participar en 1 promociones" });
    const input = screen.getByRole("spinbutton", { name: "Precio a aplicar MLA1" });

    expect(submit).toBeDisabled();
    fireEvent.change(input, { target: { value: "50" } });
    expect(submit).toBeDisabled();
    fireEvent.change(input, { target: { value: "250" } });
    expect(submit).toBeDisabled();
    fireEvent.change(input, { target: { value: "150" } });
    expect(submit).toBeEnabled();
    expect(screen.queryByRole("button", { name: "Listo" })).not.toBeInTheDocument();
  });
});

async function openAndStart(user: ReturnType<typeof userEvent.setup>, count: number): Promise<void> {
  await user.click(screen.getByRole("button", { name: "Participar en las seleccionadas" }));
  await user.click(screen.getByRole("button", { name: `Participar en ${count} promociones` }));
}

function select(...selections: readonly SelectedPromotion[]): void {
  selections.forEach((value) => usePromotionGlobalStore.getState().toggleSelection(value));
}

function selection(itemId: string, promotionOption = option()): SelectedPromotion {
  return { key: promotionSelectionKey(itemId, promotionOption), itemId, publicationTitle: `Publicación ${itemId}`, option: promotionOption };
}

function option(overrides: Partial<PromotionOption> = {}): PromotionOption {
  return { id: "P-1", offerId: null, type: "DEAL", name: "Cyber Fest", status: "candidate", originalPrice: 20_000, promotionPrice: null, minPromotionPrice: 10_000, maxPromotionPrice: 18_000, suggestedPromotionPrice: 14_000, requiresPriceSelection: true, discountPercent: null, sellerDiscountAmount: null, mercadoLibreBaseContributionAmount: 0, mercadoLibreBoostAmount: 0, mercadoLibreContributionAmount: 0, estimatedNetAmount: null, suggestedEstimatedNetAmount: null, startDate: null, finishDate: null, canApply: true, canRemove: false, saleEstimate: null, ...overrides };
}
