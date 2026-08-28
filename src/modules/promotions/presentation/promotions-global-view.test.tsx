import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { PromotionRow, PromotionsPage } from "../domain/promotion.model";
import type { PromotionOption } from "../domain/promotions.repository";
import { resetPromotionGlobalStore } from "./promotion-global.store";
import { PromotionsCatalogClient } from "./promotions-catalog.client";

const mocks = vi.hoisted(() => ({
  getOptions: vi.fn(),
  push: vi.fn(),
  searchParams: new URLSearchParams(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.push }),
  useSearchParams: () => mocks.searchParams,
}));
vi.mock("./promotion-options.action", () => ({ getPromotionOptions: mocks.getOptions }));
vi.mock("./promotion-deactivation-modal.client", () => ({
  PromotionDeactivationModal: ({ open }: Readonly<{ open: boolean }>) => open ? <div role="dialog">Confirmar baja</div> : null,
}));
vi.mock("./promotion-options-modal.client", () => ({
  PromotionOptionsModal: ({ open }: Readonly<{ open: boolean }>) => open ? <div role="dialog">Participar</div> : null,
}));
vi.mock("./deal-promotion-modal.client", () => ({
  DealPromotionModal: () => <div role="dialog">Participar en DEAL</div>,
}));

describe("vista global de promociones", () => {
  beforeEach(() => {
    resetPromotionGlobalStore();
    mocks.getOptions.mockReset();
    mocks.push.mockReset();
  });
  afterEach(cleanup);

  it("carga las opciones únicamente al expandir una publicación", async () => {
    const user = userEvent.setup();
    mocks.getOptions.mockResolvedValue([candidate()]);
    render(<PromotionsCatalogClient page={page([publication()])} />);

    expect(mocks.getOptions).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Expandir MLA1" }));

    await waitFor(() => expect(mocks.getOptions).toHaveBeenCalledTimes(1));
    expect(mocks.getOptions).toHaveBeenCalledWith("MLA1");
    expect(await screen.findByText("Cyber Fest")).toBeInTheDocument();
  });

  it("muestra una activa sin checkbox y permite confirmar su baja", async () => {
    const user = userEvent.setup();
    mocks.getOptions.mockResolvedValue([candidate({ status: "started", canApply: false, canRemove: true })]);
    render(<PromotionsCatalogClient page={page([publication()])} />);

    await user.click(screen.getByRole("button", { name: "Expandir MLA1" }));
    expect(await screen.findByText("ACTIVA")).toBeInTheDocument();
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Dejar de participar" }));
    expect(screen.getByRole("dialog")).toHaveTextContent("Confirmar baja");
  });

  it("selecciona un candidate y oculta el resumen al desmarcar el último", async () => {
    const user = userEvent.setup();
    mocks.getOptions.mockResolvedValue([candidate()]);
    render(<PromotionsCatalogClient page={page([publication()])} />);

    expect(screen.queryByText("Seleccionar todas")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Expandir MLA1" }));
    const checkbox = await screen.findByRole("checkbox", { name: "Seleccionar Cyber Fest" });
    expect(screen.getByRole("button", { name: "Participar" })).toBeInTheDocument();
    await user.click(checkbox);
    expect(screen.getByText("1 promoción seleccionada")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Participar en las seleccionadas" })).toBeInTheDocument();
    await user.click(checkbox);
    expect(screen.queryByText("1 promoción seleccionada")).not.toBeInTheDocument();
  });

  it("conserva la selección al paginar dentro de promociones", async () => {
    const user = userEvent.setup();
    mocks.getOptions.mockResolvedValue([candidate()]);
    const { rerender } = render(<PromotionsCatalogClient page={page([publication()], false, "next")} />);
    await user.click(screen.getByRole("button", { name: "Expandir MLA1" }));
    await user.click(await screen.findByRole("checkbox", { name: "Seleccionar Cyber Fest" }));
    await user.click(screen.getByRole("button", { name: "Siguiente" }));

    expect(mocks.push).toHaveBeenCalledWith("/promociones?cursor=next");
    rerender(<PromotionsCatalogClient page={page([publication({ itemId: "MLA2", title: "Buzo" })])} />);
    expect(screen.getByText("1 promoción seleccionada")).toBeInTheDocument();
  });

  it("usa sugerido y rango ante price cero sin inventar descuento ni neto", async () => {
    const user = userEvent.setup();
    mocks.getOptions.mockResolvedValue([candidate({ promotionPrice: 0 })]);
    render(<PromotionsCatalogClient page={page([publication()])} />);
    await user.click(screen.getByRole("button", { name: "Expandir MLA1" }));

    expect(await screen.findByText(`${money(14_449)} sugerido`)).toBeInTheDocument();
    expect(screen.getByText(`Rango ${money(3_400)} - ${money(15_299)}`)).toBeInTheDocument();
    expect(screen.getByText("A definir")).toBeInTheDocument();
    expect(screen.getByText("Se calcula al elegir precio")).toBeInTheDocument();
    expect(screen.queryByText(money(0))).not.toBeInTheDocument();
  });

  it("renderiza todas las opciones como filas y las ordena por estado", async () => {
    const user = userEvent.setup();
    mocks.getOptions.mockResolvedValue([
      candidate({ id: "P-4", name: "Programada", status: "pending", canApply: false }),
      candidate({ id: "P-2", name: "Disponible dos" }),
      candidate({ id: "P-1", name: "Activa", status: "started", canApply: false, canRemove: true }),
      candidate({ id: "P-3", name: "Disponible tres" }),
    ]);
    render(<PromotionsCatalogClient page={page([publication()])} />);

    await user.click(screen.getByRole("button", { name: "Expandir MLA1" }));
    expect(await screen.findByText("Disponible dos")).toBeInTheDocument();
    const dataRows = screen.getAllByRole("row").slice(1);

    expect(dataRows).toHaveLength(4);
    expect(dataRows[0]).toHaveTextContent("Activa");
    expect(dataRows[1]).toHaveTextContent("Disponible dos");
    expect(dataRows[2]).toHaveTextContent("Disponible tres");
    expect(dataRows[3]).toHaveTextContent("Programada");
    expect(mocks.getOptions).toHaveBeenCalledTimes(1);
  });
});

function publication(overrides: Partial<PromotionRow> = {}): PromotionRow {
  return { itemId: "MLA1", familyId: "F-1", title: "Remera", thumbnail: null, productGroup: "WOMEN_TSHIRT", price: 20_000, currentPromotion: null, hasActivePromotion: false, availablePromotionsCount: 1, promotionStatus: "AVAILABLE", ...overrides };
}

function page(publications: readonly PromotionRow[], done = true, nextCursor: string | null = null): PromotionsPage {
  return { publications, done, nextCursor, count: publications.length };
}

function candidate(overrides: Partial<PromotionOption> = {}): PromotionOption {
  return { id: "P-1", offerId: null, type: "DEAL", name: "Cyber Fest", status: "candidate", originalPrice: 20_000, promotionPrice: null, minPromotionPrice: 3_400, maxPromotionPrice: 15_299, suggestedPromotionPrice: 14_449, requiresPriceSelection: true, discountPercent: null, sellerDiscountAmount: null, mercadoLibreBaseContributionAmount: 0, mercadoLibreBoostAmount: 0, mercadoLibreContributionAmount: 0, estimatedNetAmount: null, startDate: null, finishDate: null, canApply: true, canRemove: false, saleEstimate: null, ...overrides };
}

function money(value: number): string {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(value).replace("\u00a0", " ");
}
