import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { PromotionOption } from "../domain/promotions.repository";
import {
  promotionSelectionKey,
  resetPromotionGlobalStore,
  usePromotionGlobalStore,
  type SelectedPromotion,
} from "./promotion-global.store";
import { PromotionSelectionSummary } from "./promotion-selection-summary.client";

const mocks = vi.hoisted(() => ({ apply: vi.fn(), refresh: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mocks.refresh }),
}));
vi.mock("./apply-selected-promotion.action", () => ({
  applySelectedPromotion: mocks.apply,
}));

describe("aplicación masiva secuencial", () => {
  beforeEach(() => {
    resetPromotionGlobalStore();
    mocks.apply.mockReset();
    mocks.refresh.mockReset();
  });
  afterEach(cleanup);

  it("una campaña muestra un solo input de campaña y conserva la edición individual", async () => {
    const user = userEvent.setup();
    select(selection("MLA1"));
    render(<PromotionSelectionSummary />);

    await openPricing(user);

    const modal = screen.getByRole("dialog", { name: "Promociones seleccionadas" });
    expect(screen.getByText(/Publicación MLA1/)).toBeInTheDocument();
    expect(screen.getByText("Modificar precio para esta campaña")).toBeInTheDocument();
    expect(screen.getAllByRole("spinbutton", { name: /^Precio campaña/ })).toHaveLength(1);
    expect(screen.getByRole("spinbutton", { name: "Precio a aplicar MLA1" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Participar en 1/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Siguiente" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Atrás" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Confirmar 1 promociones" })).toBeInTheDocument();
    expect(screen.getAllByRole("dialog")).toEqual([modal]);
  });

  it("dos campañas muestran dos inputs de campaña", async () => {
    const user = userEvent.setup();
    select(
      selection("MLA1", option({ id: "CAMPAIGN-A", name: "Campaña A" })),
      selection("MLA2", option({ id: "CAMPAIGN-B", name: "Campaña B" })),
    );
    render(<PromotionSelectionSummary />);
    await openPricing(user);

    expect(screen.getAllByRole("spinbutton", { name: /^Precio campaña/ })).toHaveLength(2);
    expect(screen.getByRole("spinbutton", { name: "Precio campaña Campaña A" })).toBeInTheDocument();
    expect(screen.getByRole("spinbutton", { name: "Precio campaña Campaña B" })).toBeInTheDocument();
  });

  it("tres campañas muestran tres inputs de campaña", async () => {
    const user = userEvent.setup();
    select(
      selection("MLA1", option({ id: "CAMPAIGN-A", name: "Campaña A" })),
      selection("MLA2", option({ id: "CAMPAIGN-B", name: "Campaña B" })),
      selection("MLA3", option({ id: "CAMPAIGN-C", name: "Campaña C" })),
    );
    render(<PromotionSelectionSummary />);
    await openPricing(user);

    expect(screen.getAllByRole("spinbutton", { name: /^Precio campaña/ })).toHaveLength(3);
  });

  it("aplicar el precio de la campaña A no modifica la campaña B", async () => {
    const user = userEvent.setup();
    select(
      selection("MLA1", option({ id: "A", name: "Campaña A", suggestedPromotionPrice: 31_000, minPromotionPrice: 28_000, maxPromotionPrice: 35_000 })),
      selection("MLA2", option({ id: "B", name: "Campaña B", suggestedPromotionPrice: 43_000, minPromotionPrice: 40_000, maxPromotionPrice: 45_000 })),
    );
    render(<PromotionSelectionSummary />);
    await openPricing(user);

    setInput(screen.getByRole("spinbutton", { name: "Precio campaña Campaña A" }), 30_000);
    await user.click(screen.getByRole("button", { name: "Aplicar precio Campaña A" }));

    expect(screen.getByRole("spinbutton", { name: "Precio a aplicar MLA1" })).toHaveValue("30000");
    expect(screen.getByRole("spinbutton", { name: "Precio a aplicar MLA2" })).toHaveValue("43000");
  });

  it("aplicar el precio de la campaña B no modifica la campaña A", async () => {
    const user = userEvent.setup();
    select(
      selection("MLA1", option({ id: "A", name: "Campaña A", suggestedPromotionPrice: 31_000, minPromotionPrice: 28_000, maxPromotionPrice: 35_000 })),
      selection("MLA2", option({ id: "B", name: "Campaña B", suggestedPromotionPrice: 43_000, minPromotionPrice: 40_000, maxPromotionPrice: 45_000 })),
    );
    render(<PromotionSelectionSummary />);
    await openPricing(user);

    setInput(screen.getByRole("spinbutton", { name: "Precio campaña Campaña B" }), 44_000);
    await user.click(screen.getByRole("button", { name: "Aplicar precio Campaña B" }));

    expect(screen.getByRole("spinbutton", { name: "Precio a aplicar MLA1" })).toHaveValue("31000");
    expect(screen.getByRole("spinbutton", { name: "Precio a aplicar MLA2" })).toHaveValue("44000");
  });

  it("calcula el rango común independientemente para cada campaña", async () => {
    const user = userEvent.setup();
    select(
      selection("MLA1", option({ id: "A", name: "Campaña A", minPromotionPrice: 28_000, maxPromotionPrice: 32_000, suggestedPromotionPrice: 30_000 })),
      selection("MLA2", option({ id: "A", name: "Campaña A", minPromotionPrice: 29_000, maxPromotionPrice: 31_349, suggestedPromotionPrice: 30_000 })),
      selection("MLA3", option({ id: "B", name: "Campaña B", minPromotionPrice: 40_000, maxPromotionPrice: 46_000, suggestedPromotionPrice: 43_000 })),
      selection("MLA4", option({ id: "B", name: "Campaña B", minPromotionPrice: 41_000, maxPromotionPrice: 45_000, suggestedPromotionPrice: 43_000 })),
    );
    render(<PromotionSelectionSummary />);
    await openPricing(user);

    const ranges = screen.getAllByText(/Rango común permitido:/);
    expect(ranges[0]).toHaveTextContent("$ 29.000 - $ 31.349");
    expect(ranges[1]).toHaveTextContent("$ 41.000 - $ 45.000");
  });

  it("calcula el descuento aproximado simple y en rango por campaña", async () => {
    const user = userEvent.setup();
    select(
      selection("MLA1", option({ id: "A", name: "Campaña A", originalPrice: 40_000, minPromotionPrice: 20_000, maxPromotionPrice: 39_000, suggestedPromotionPrice: 30_000 })),
      selection("MLA2", option({ id: "B", name: "Campaña B", originalPrice: 40_000, minPromotionPrice: 20_000, maxPromotionPrice: 39_000, suggestedPromotionPrice: 30_000 })),
      selection("MLA3", option({ id: "B", name: "Campaña B", originalPrice: 50_000, minPromotionPrice: 20_000, maxPromotionPrice: 49_000, suggestedPromotionPrice: 30_000 })),
    );
    render(<PromotionSelectionSummary />);
    await openPricing(user);

    setInput(screen.getByRole("spinbutton", { name: "Precio campaña Campaña A" }), 30_000);
    setInput(screen.getByRole("spinbutton", { name: "Precio campaña Campaña B" }), 30_000);

    expect(screen.getByText("Descuento aprox.: 25 %")).toBeInTheDocument();
    expect(screen.getByText("Descuento aprox.: 25 % - 40 %")).toBeInTheDocument();
  });

  it("aplica $30.000 a todas las filas válidas de una campaña y calcula el descuento real", async () => {
    const user = userEvent.setup();
    const priced = option({
      originalPrice: 32_999,
      suggestedPromotionPrice: 31_100,
      minPromotionPrice: 28_000,
      maxPromotionPrice: 31_349,
    });
    select(selection("MLA1", priced), selection("MLA2", priced));
    render(<PromotionSelectionSummary />);
    await openPricing(user);

    expect(screen.getAllByRole("checkbox", { name: /Excluir del precio de esta campaña/ }))
      .toEqual(expect.arrayContaining([
        expect.objectContaining({ checked: false }),
        expect.objectContaining({ checked: false }),
      ]));
    expect(screen.getByText(/Rango común permitido/)).toHaveTextContent("$ 28.000 - $ 31.349");
    setInput(screen.getByRole("spinbutton", { name: "Precio campaña Cyber Fest" }), 30_000);
    await user.click(screen.getByRole("button", { name: "Aplicar precio Cyber Fest" }));

    expect(screen.getByRole("spinbutton", { name: "Precio a aplicar MLA1" })).toHaveValue("30000");
    expect(screen.getByRole("spinbutton", { name: "Precio a aplicar MLA2" })).toHaveValue("30000");
    expect(screen.getAllByText("Descuento: 9,09 %")).toHaveLength(2);
  });

  it("excluye, restaura y vuelve a aplicar el precio de campaña al cambiar el checkbox", async () => {
    const user = userEvent.setup();
    select(selection("MLA1", option({
      originalPrice: 32_999,
      suggestedPromotionPrice: 31_100,
      minPromotionPrice: 28_000,
      maxPromotionPrice: 31_349,
    })));
    render(<PromotionSelectionSummary />);
    await openPricing(user);

    const campaignInput = screen.getByRole("spinbutton", { name: "Precio campaña Cyber Fest" });
    const priceInput = screen.getByRole("spinbutton", { name: "Precio a aplicar MLA1" });
    const checkbox = screen.getByRole("checkbox", {
      name: "Excluir del precio de esta campaña MLA1",
    });
    expect(checkbox).not.toBeChecked();

    setInput(campaignInput, 30_000);
    await user.click(screen.getByRole("button", { name: "Aplicar precio Cyber Fest" }));
    expect(priceInput).toHaveValue("30000");

    await user.click(checkbox);
    expect(priceInput).toHaveValue("31100");
    expect(priceInput).toBeEnabled();
    await user.click(screen.getByRole("button", { name: "Aplicar precio Cyber Fest" }));
    expect(priceInput).toHaveValue("31100");

    await user.click(checkbox);
    expect(priceInput).toHaveValue("30000");
    expect(priceInput).toBeEnabled();
  });

  it("no aplica un precio de campaña fuera de rango y muestra el warning de la fila", async () => {
    const user = userEvent.setup();
    select(
      selection("MLA1", option({ minPromotionPrice: 28_000, maxPromotionPrice: 31_349, suggestedPromotionPrice: 31_100 })),
      selection("MLA2", option({ minPromotionPrice: 30_500, maxPromotionPrice: 31_500, suggestedPromotionPrice: 31_200 })),
    );
    render(<PromotionSelectionSummary />);
    await openPricing(user);

    setInput(screen.getByRole("spinbutton", { name: "Precio campaña Cyber Fest" }), 30_000);
    await user.click(screen.getByRole("button", { name: "Aplicar precio Cyber Fest" }));

    expect(screen.getByRole("spinbutton", { name: "Precio a aplicar MLA1" })).toHaveValue("30000");
    expect(screen.getByRole("spinbutton", { name: "Precio a aplicar MLA2" })).toHaveValue("31200");
    expect(screen.getByText(/30\.000.*fuera del rango permitido/)).toBeInTheDocument();
    expect(screen.getByText("Aplicado a 1 de 2 promociones")).toBeInTheDocument();
    expect(screen.getByText(/1 promoción no acepta.*30\.000/)).toBeInTheDocument();
  });

  it("maneja varias exclusiones de campaña independientemente y actualiza los contadores", async () => {
    const user = userEvent.setup();
    select(selection("MLA1"), selection("MLA2"), selection("MLA3"));
    render(<PromotionSelectionSummary />);
    await openPricing(user);

    await user.click(screen.getByRole("checkbox", { name: "Excluir del precio de esta campaña MLA1" }));
    await user.click(screen.getByRole("checkbox", { name: "Excluir del precio de esta campaña MLA2" }));
    setInput(screen.getByRole("spinbutton", { name: "Precio campaña Cyber Fest" }), 15_000);
    await user.click(screen.getByRole("button", { name: "Aplicar precio Cyber Fest" }));

    expect(screen.getByRole("spinbutton", { name: "Precio a aplicar MLA1" })).toHaveValue("14000");
    expect(screen.getByRole("spinbutton", { name: "Precio a aplicar MLA2" })).toHaveValue("14000");
    expect(screen.getByRole("spinbutton", { name: "Precio a aplicar MLA3" })).toHaveValue("15000");
    expect(screen.getByText("Aplicado a 1 de 3 promociones")).toBeInTheDocument();
    expect(screen.getByText("2 excluidas del precio de esta campaña")).toBeInTheDocument();

    await user.click(screen.getByRole("checkbox", { name: "Excluir del precio de esta campaña MLA1" }));
    expect(screen.getByRole("spinbutton", { name: "Precio a aplicar MLA1" })).toHaveValue("15000");
    expect(screen.getByRole("spinbutton", { name: "Precio a aplicar MLA2" })).toHaveValue("14000");
    expect(screen.getByText("Aplicado a 2 de 3 promociones")).toBeInTheDocument();
    expect(screen.getByText("1 excluida del precio de esta campaña")).toBeInTheDocument();
  });

  it("permite editar una fila y valida mínimo y máximo antes de confirmar", async () => {
    const user = userEvent.setup();
    select(selection("MLA1", option({
      suggestedPromotionPrice: 250,
      minPromotionPrice: 100,
      maxPromotionPrice: 200,
    })));
    render(<PromotionSelectionSummary />);
    await openPricing(user);

    const submit = screen.getByRole("button", { name: "Confirmar 1 promociones" });
    const input = screen.getByRole("spinbutton", { name: "Precio a aplicar MLA1" });

    expect(submit).toBeDisabled();
    setInput(input, 50);
    expect(screen.getByText("El precio debe estar dentro del rango permitido.")).toBeInTheDocument();
    expect(submit).toBeDisabled();
    setInput(input, 250);
    expect(submit).toBeDisabled();
    setInput(input, 150);
    expect(submit).toBeEnabled();
  });

  it("conserva la edición individual de una publicación excluida", async () => {
    const user = userEvent.setup();
    select(selection("MLA1"));
    render(<PromotionSelectionSummary />);
    await openPricing(user);

    setInput(screen.getByRole("spinbutton", { name: "Precio campaña Cyber Fest" }), 15_000);
    await user.click(screen.getByRole("button", { name: "Aplicar precio Cyber Fest" }));
    await user.click(screen.getByRole("checkbox", {
      name: "Excluir del precio de esta campaña MLA1",
    }));
    expect(screen.getByRole("spinbutton", { name: "Precio campaña Cyber Fest" })).toHaveValue("15000");
    expect(screen.getByRole("spinbutton", { name: "Precio a aplicar MLA1" })).toHaveValue("14000");
    expect(screen.getByRole("checkbox", {
      name: "Excluir del precio de esta campaña MLA1",
    })).toBeChecked();
  });

  it("conserva promotionPrice y no ofrece edición cuando ML no requiere precio", async () => {
    const user = userEvent.setup();
    mocks.apply.mockResolvedValue({ ok: true });
    select(selection("MLA1", option({
      requiresPriceSelection: false,
      promotionPrice: 15_000,
    })));
    render(<PromotionSelectionSummary />);
    await openPricing(user);

    expect(screen.queryByRole("spinbutton", { name: "Precio a aplicar MLA1" })).not.toBeInTheDocument();
    expect(screen.queryByRole("checkbox", {
      name: "Excluir del precio de esta campaña MLA1",
    })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Confirmar 1 promociones" }));

    expect(await screen.findByText("Proceso completado")).toBeInTheDocument();
    expect(mocks.apply).toHaveBeenCalledWith(expect.objectContaining({
      itemId: "MLA1",
      selectedPrice: null,
    }));
  });

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

  it("continúa después de un error y conserva solamente las selecciones fallidas", async () => {
    const user = userEvent.setup();
    mocks.apply
      .mockResolvedValueOnce({ ok: true })
      .mockResolvedValueOnce({ ok: false, message: "Mercado Libre rechazó la promoción" })
      .mockResolvedValueOnce({ ok: true });
    const first = selection("MLA1");
    const failed = selection("MLA2");
    const third = selection("MLA3");
    select(first, failed, third);
    [first, failed, third].forEach((value) => (
      usePromotionGlobalStore.getState().saveOptions(value.itemId, [value.option])
    ));
    render(<PromotionSelectionSummary />);

    await openAndStart(user, 3);
    expect(await screen.findByText("Proceso completado")).toBeInTheDocument();
    expect(screen.getByText("2 correctas · 1 con error")).toBeInTheDocument();
    expect(screen.getByText("Mercado Libre rechazó la promoción")).toBeInTheDocument();
    expect(mocks.apply).toHaveBeenCalledTimes(3);
    const remaining = usePromotionGlobalStore.getState().selections;
    expect(remaining[first.key]).toBeUndefined();
    expect(remaining[third.key]).toBeUndefined();
    expect(remaining[failed.key]).toBeDefined();
    expect(usePromotionGlobalStore.getState().optionsByItem).toEqual({});
  });

  it("actualiza el progreso y evita otra cola con doble submit", async () => {
    const user = userEvent.setup();
    const resolvers: Array<(result: Readonly<{ ok: true }>) => void> = [];
    mocks.apply.mockImplementation(() => new Promise((resolve) => resolvers.push(resolve)));
    select(selection("MLA1"), selection("MLA2"), selection("MLA3"));
    render(<PromotionSelectionSummary />);
    await openPricing(user);
    const start = screen.getByRole("button", { name: "Confirmar 3 promociones" });
    fireEvent.click(start);
    fireEvent.click(start);

    await waitFor(() => expect(mocks.apply).toHaveBeenCalledTimes(1));
    expect(screen.getByText("Procesando 1 de 3")).toBeInTheDocument();
    expect(screen.getByText("0 de 3 procesadas")).toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "0");

    resolvers[0]?.({ ok: true });
    await waitFor(() => expect(mocks.apply).toHaveBeenCalledTimes(2));
    expect(screen.getByText("Procesando 2 de 3")).toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "33");

    resolvers[1]?.({ ok: true });
    await waitFor(() => expect(mocks.apply).toHaveBeenCalledTimes(3));
    expect(screen.getByText("Procesando 3 de 3")).toBeInTheDocument();
    resolvers[2]?.({ ok: true });
    expect(await screen.findByText("Proceso completado")).toBeInTheDocument();
  });

  it("procesa secuencialmente las 50 selecciones", async () => {
    const user = userEvent.setup();
    mocks.apply.mockResolvedValue({ ok: true });
    select(...Array.from({ length: 50 }, (_, index) => selection(`MLA${index + 1}`)));
    render(<PromotionSelectionSummary />);

    await openAndStart(user, 50);

    expect(await screen.findByText("50 correctas · 0 con error")).toBeInTheDocument();
    expect(mocks.apply).toHaveBeenCalledTimes(50);
    expect(mocks.apply.mock.calls.map((call) => call[0].itemId)).toEqual(
      Array.from({ length: 50 }, (_, index) => `MLA${index + 1}`),
    );
  });
});

async function openPricing(user: ReturnType<typeof userEvent.setup>): Promise<void> {
  await user.click(screen.getByRole("button", { name: "Participar en las seleccionadas" }));
}

async function openAndStart(
  user: ReturnType<typeof userEvent.setup>,
  count: number,
): Promise<void> {
  await openPricing(user);
  await user.click(screen.getByRole("button", { name: `Confirmar ${count} promociones` }));
}

function setInput(input: HTMLElement, value: number): void {
  fireEvent.change(input, { target: { value: String(value) } });
}

function select(...selections: readonly SelectedPromotion[]): void {
  selections.forEach((value) => usePromotionGlobalStore.getState().toggleSelection(value));
}

function selection(
  itemId: string,
  promotionOption = option(),
): SelectedPromotion {
  return {
    key: promotionSelectionKey(itemId, promotionOption),
    itemId,
    publicationTitle: `Publicación ${itemId}`,
    option: promotionOption,
  };
}

function option(overrides: Partial<PromotionOption> = {}): PromotionOption {
  return {
    id: "P-1",
    offerId: null,
    type: "DEAL",
    name: "Cyber Fest",
    status: "candidate",
    originalPrice: 20_000,
    promotionPrice: null,
    minPromotionPrice: 10_000,
    maxPromotionPrice: 18_000,
    suggestedPromotionPrice: 14_000,
    requiresPriceSelection: true,
    discountPercent: null,
    sellerDiscountAmount: null,
    mercadoLibreBaseContributionAmount: 0,
    mercadoLibreBoostAmount: 0,
    mercadoLibreContributionAmount: 0,
    estimatedNetAmount: null,
    suggestedEstimatedNetAmount: null,
    startDate: null,
    finishDate: null,
    canApply: true,
    canRemove: false,
    saleEstimate: null,
    ...overrides,
  };
}
