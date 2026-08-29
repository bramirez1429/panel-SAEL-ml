import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import type { PromotionRow, PromotionsPage } from "../domain/promotion.model";
import type { PromotionOption } from "../domain/promotions.repository";
import { resetPromotionGlobalStore } from "./promotion-global.store";
import { PromotionsCatalogClient } from "./promotions-catalog.client";

const mocks = vi.hoisted(() => ({ getOptions: vi.fn(), push: vi.fn(), searchParams: new URLSearchParams() }));

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: mocks.push }), useSearchParams: () => mocks.searchParams }));
vi.mock("./promotion-options.action", () => ({ getPromotionOptions: mocks.getOptions }));
vi.mock("./promotion-options-modal.client", () => ({
  PromotionOptionsModal: ({ open }: Readonly<{ open: boolean }>) => open ? <div role="dialog">Participar</div> : null,
}));
vi.mock("./deal-promotion-modal.client", () => ({ DealPromotionModal: () => <div role="dialog">Participar en DEAL</div> }));
vi.mock("./promotion-bulk-application-modal.client", () => ({
  PromotionBulkApplicationModal: () => <div role="dialog">Aplicación masiva</div>,
}));

class ImmediateIntersectionObserver {
  readonly root = null;
  readonly rootMargin = "0px";
  readonly thresholds = [0];

  constructor(private readonly callback: IntersectionObserverCallback) {}
  disconnect(): void {}
  unobserve(): void {}
  takeRecords(): IntersectionObserverEntry[] { return []; }
  observe(target: Element): void {
    queueMicrotask(() => this.callback([{ isIntersecting: true, target } as IntersectionObserverEntry], this as unknown as IntersectionObserver));
  }
}

describe("vista global de promociones", () => {
  beforeAll(() => vi.stubGlobal("IntersectionObserver", ImmediateIntersectionObserver));
  beforeEach(() => {
    resetPromotionGlobalStore();
    mocks.getOptions.mockReset();
    mocks.push.mockReset();
  });
  afterEach(cleanup);

  it("carga opciones al entrar en viewport, sin desplegable, y reutiliza la caché", async () => {
    mocks.getOptions.mockResolvedValue([candidate()]);
    const { rerender } = render(<PromotionsCatalogClient page={page([publication()])} />);

    expect(screen.getByText("Remera")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Expandir|Cerrar/ })).not.toBeInTheDocument();
    expect(await screen.findByText("Cyber Fest")).toBeInTheDocument();
    rerender(<PromotionsCatalogClient page={page([publication()])} />);
    await waitFor(() => expect(mocks.getOptions).toHaveBeenCalledTimes(1));
  });

  it("muestra un skeleton independiente en cada campo mientras carga", async () => {
    let resolveOptions: (options: readonly PromotionOption[]) => void = () => undefined;
    mocks.getOptions.mockReturnValue(new Promise((resolve) => { resolveOptions = resolve; }));
    render(<PromotionsCatalogClient page={page([publication()])} />);

    for (const label of ["Cargando selección", "Cargando promoción", "Cargando descuento", "Cargando precio final", "Cargando importe neto", "Cargando tareas"]) {
      expect(await screen.findByLabelText(label)).toBeInTheDocument();
    }
    resolveOptions([candidate()]);
    expect(await screen.findByText("Cyber Fest")).toBeInTheDocument();
  });

  it("renderiza started, candidates y pending en filas ordenadas", async () => {
    mocks.getOptions.mockResolvedValue([
      candidate({ id: "P-4", name: "Programada", status: "pending", canApply: false }),
      candidate({ id: "P-2", name: "Disponible dos" }),
      candidate({ id: "P-1", name: "Activa", status: "started", canApply: false, canRemove: true }),
      candidate({ id: "P-3", name: "Disponible tres" }),
    ]);
    render(<PromotionsCatalogClient page={page([publication()])} />);
    expect(await screen.findByText("Disponible dos")).toBeInTheDocument();
    const dataRows = screen.getAllByRole("row").slice(1);

    expect(dataRows).toHaveLength(4);
    expect(dataRows[0]).toHaveTextContent("ACTIVA");
    expect(dataRows[1]).toHaveTextContent("Disponible dos");
    expect(dataRows[2]).toHaveTextContent("Disponible tres");
    expect(dataRows[3]).toHaveTextContent("Programada");
    expect(screen.getByRole("button", { name: "Seguir participando" })).toHaveClass("ant-btn-link");
  });

  it("carga promociones para una publicación legacy", async () => {
    mocks.getOptions.mockResolvedValue([candidate({ name: "Legacy Promo" })]);
    render(<PromotionsCatalogClient page={page([publication({ familyId: null })])} />);

    expect(await screen.findByText("Legacy Promo")).toBeInTheDocument();
    expect(mocks.getOptions).toHaveBeenCalledWith("MLA1");
  });

  it("muestra sugerido, rango y neto sin interpretar price cero", async () => {
    mocks.getOptions.mockResolvedValue([candidate({ promotionPrice: 0, estimatedNetAmount: 12_345 })]);
    render(<PromotionsCatalogClient page={page([publication()])} />);

    expect(await screen.findByText(`${money(14_449)} sugerido`)).toBeInTheDocument();
    expect(screen.getByText(`Rango ${money(3_400)} - ${money(15_299)}`)).toBeInTheDocument();
    expect(screen.getByText(money(12_345))).toBeInTheDocument();
    expect(screen.queryByText(money(0))).not.toBeInTheDocument();
  });

  it("prioriza el neto real sobre el estimado sugerido", async () => {
    mocks.getOptions.mockResolvedValue([candidate({ estimatedNetAmount: 12_345, suggestedEstimatedNetAmount: 44_344 })]);
    render(<PromotionsCatalogClient page={page([publication()])} />);

    expect(await screen.findByText(money(12_345))).toBeInTheDocument();
    expect(screen.queryByText(/44\.344/)).not.toBeInTheDocument();
  });

  it("muestra el neto sugerido real informado por backend sin recalcularlo", async () => {
    mocks.getOptions.mockResolvedValue([candidate({ estimatedNetAmount: null, suggestedEstimatedNetAmount: 44_344 })]);
    render(<PromotionsCatalogClient page={page([publication()])} />);

    expect(await screen.findByText(`≈ ${money(44_344)}`)).toBeInTheDocument();
    expect(screen.getByText("con precio sugerido")).toBeInTheDocument();
  });

  it("explica cuándo el neto depende de elegir precio y no hay estimación", async () => {
    mocks.getOptions.mockResolvedValue([candidate({ estimatedNetAmount: null, suggestedEstimatedNetAmount: null })]);
    render(<PromotionsCatalogClient page={page([publication()])} />);

    expect(await screen.findByText("Se calcula al elegir precio")).toBeInTheDocument();
  });

  it("selecciona candidates, conserva la selección al paginar y usa botón primary", async () => {
    const user = userEvent.setup();
    mocks.getOptions.mockResolvedValue([candidate()]);
    const { rerender } = render(<PromotionsCatalogClient page={page([publication()], false, "next")} />);
    const checkbox = await screen.findByRole("checkbox", { name: "Seleccionar Cyber Fest" });
    const participate = screen.getByRole("button", { name: "Participar" });

    expect(participate).toHaveClass("ant-btn-primary");
    expect(screen.queryByText("Seleccionar todas")).not.toBeInTheDocument();
    await user.click(checkbox);
    await user.click(screen.getByRole("button", { name: "Siguiente" }));
    expect(mocks.push).toHaveBeenCalledWith("/promociones?cursor=next");
    rerender(<PromotionsCatalogClient page={page([publication({ itemId: "MLA2", title: "Buzo" })])} />);
    expect(screen.getByText("1 promoción seleccionada")).toBeInTheDocument();
  });

  it("limita a tres las cargas simultáneas", async () => {
    let release: () => void = () => undefined;
    const gate = new Promise<void>((resolve) => { release = resolve; });
    let active = 0;
    let maximum = 0;
    mocks.getOptions.mockImplementation(async () => {
      active += 1;
      maximum = Math.max(maximum, active);
      await gate;
      active -= 1;
      return [];
    });
    render(<PromotionsCatalogClient page={page(Array.from({ length: 6 }, (_, index) => publication({ itemId: `MLA${index + 1}`, title: `Publicación ${index + 1}` })))} />);

    await waitFor(() => expect(mocks.getOptions).toHaveBeenCalledTimes(3));
    expect(maximum).toBe(3);
    release();
    await waitFor(() => expect(mocks.getOptions).toHaveBeenCalledTimes(6));
    expect(maximum).toBeLessThanOrEqual(3);
  });
});

function publication(overrides: Partial<PromotionRow> = {}): PromotionRow {
  return { itemId: "MLA1", familyId: "F-1", title: "Remera", thumbnail: null, productGroup: "WOMEN_TSHIRT", price: 20_000, currentPromotion: null, hasActivePromotion: false, availablePromotionsCount: 1, promotionStatus: "AVAILABLE", ...overrides };
}

function page(publications: readonly PromotionRow[], done = true, nextCursor: string | null = null): PromotionsPage {
  return { publications, done, nextCursor, count: publications.length };
}

function candidate(overrides: Partial<PromotionOption> = {}): PromotionOption {
  return { id: "P-1", offerId: null, type: "DEAL", name: "Cyber Fest", status: "candidate", originalPrice: 20_000, promotionPrice: null, minPromotionPrice: 3_400, maxPromotionPrice: 15_299, suggestedPromotionPrice: 14_449, requiresPriceSelection: true, discountPercent: null, sellerDiscountAmount: null, mercadoLibreBaseContributionAmount: 0, mercadoLibreBoostAmount: 0, mercadoLibreContributionAmount: 0, estimatedNetAmount: null, suggestedEstimatedNetAmount: null, startDate: null, finishDate: null, canApply: true, canRemove: false, saleEstimate: null, ...overrides };
}

function money(value: number): string {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(value).replace("\u00a0", " ");
}
