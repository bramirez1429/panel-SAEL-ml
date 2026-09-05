import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { PromotionsPage } from "../domain/promotion.model";

const repository = vi.hoisted(() => ({ getCatalog: vi.fn() }));

vi.mock("../promotions.composition.server", () => ({ createPromotionsRepository: () => repository }));
vi.mock("./publication-search-bar.client", () => ({
  PublicationSearchBar: ({ initialSearch }: Readonly<{ initialSearch: string }>) => <div data-testid="search">{initialSearch}</div>,
}));
vi.mock("./promotions-catalog.client", () => ({
  PromotionsCatalogClient: ({ page, activeSearch }: Readonly<{ page: PromotionsPage; activeSearch: string }>) => <div data-testid="results" data-search={activeSearch}>
    {page.publications.map((publication) => <span key={publication.itemId}>{publication.itemId}</span>)}
  </div>,
}));

import { PromotionsCatalog } from "./promotions-catalog.server";

describe("PromotionsCatalog search SSR", () => {
  beforeEach(() => repository.getCatalog.mockReset());
  afterEach(cleanup);

  it("usa el listado normal cuando search está vacío", async () => {
    repository.getCatalog.mockResolvedValue(page([]));
    render(await PromotionsCatalog({ searchParams: Promise.resolve({ search: "   " }) }));

    expect(repository.getCatalog).toHaveBeenCalledWith(expect.objectContaining({ limit: 20, cursor: null }));
    expect(repository.getCatalog.mock.calls[0]?.[0]).not.toHaveProperty("search");
  });

  it("FAMILY renderiza todos los MLA entregados por backend", async () => {
    repository.getCatalog.mockResolvedValue(page([row("MLA1", "123456"), row("MLA2", "123456")]));
    render(await PromotionsCatalog({ searchParams: Promise.resolve({ search: "123456" }) }));

    expect(repository.getCatalog).toHaveBeenCalledWith(expect.objectContaining({ search: "123456" }));
    expect(screen.getByText("MLA1")).toBeInTheDocument();
    expect(screen.getByText("MLA2")).toBeInTheDocument();
  });

  it("MLA normaliza y renderiza el resultado exacto", async () => {
    repository.getCatalog.mockResolvedValue(page([row("MLA1947917494", null)]));
    render(await PromotionsCatalog({ searchParams: Promise.resolve({ search: "mla1947917494" }) }));

    expect(repository.getCatalog).toHaveBeenCalledWith(expect.objectContaining({ search: "MLA1947917494" }));
    expect(within(screen.getByTestId("results")).getByText("MLA1947917494")).toBeInTheDocument();
  });

  it("TITLE renderiza múltiples coincidencias", async () => {
    repository.getCatalog.mockResolvedValue(page([row("MLA10", null), row("MLA20", "F-2")]));
    render(await PromotionsCatalog({ searchParams: Promise.resolve({ search: "  remera mujer  " }) }));

    expect(repository.getCatalog).toHaveBeenCalledWith(expect.objectContaining({ search: "remera mujer" }));
    expect(screen.getByText("MLA10")).toBeInTheDocument();
    expect(screen.getByText("MLA20")).toBeInTheDocument();
  });
});

function page(publications: PromotionsPage["publications"]): PromotionsPage {
  return { publications, done: true, nextCursor: null, count: publications.length };
}

function row(itemId: string, familyId: string | null): PromotionsPage["publications"][number] {
  return { itemId, familyId, title: `Título ${itemId}`, thumbnail: null, sku: null, stock: null, freeShipping: null, installmentLabel: null, productGroup: "WOMEN_TSHIRT", price: 10_000, currentPromotion: null, hasActivePromotion: false, availablePromotionsCount: 0, promotionStatus: "NONE" };
}
