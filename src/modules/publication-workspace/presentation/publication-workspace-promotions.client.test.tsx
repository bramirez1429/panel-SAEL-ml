import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type {
  PublicationWorkspaceItem,
  PublicationWorkspaceSelection,
} from "../domain/publication-workspace.model";
import { createPublicationVisualOrder } from "@/shared/lib/publication-variant";
import type { PromotionsPage } from "@/modules/promotions/domain/promotion.model";
import { resetPromotionGlobalStore } from "@/modules/promotions/presentation/promotion-global.store";

const mocks = vi.hoisted(() => ({
  table: vi.fn((_props: unknown) => null),
  getPromotionOptions: vi.fn(),
}));

vi.mock("@/modules/promotions/presentation/promotions-table.client", () => ({
  PromotionsTable: mocks.table,
  isApplicablePromotionOption: () => false,
}));
vi.mock("@/modules/promotions/presentation/promotion-options.action", () => ({
  getPromotionOptions: mocks.getPromotionOptions,
}));
vi.mock("@/modules/promotions/presentation/promotion-selection-summary.client", () => ({
  PromotionSelectionSummary: () => null,
}));
vi.mock("@/modules/promotions/presentation/promotion-bulk-deactivation-launcher.client", () => ({
  PromotionBulkDeactivationLauncher: () => null,
}));

import { PublicationWorkspacePromotions } from "./publication-workspace-promotions.client";

function item(id: string, color: string, size: string): PublicationWorkspaceItem {
  return {
    itemId: id,
    familyId: "family-123",
    model: "VARIANT_PRICING",
    title: `Remera Mujer ${color} ${size}`,
    imageUrl: null,
    thumbnailUrl: "https://images.example.com/" + id + ".jpg",
    sku: `SKU-${id}`,
    status: "active",
    stock: 2,
    sold: 0,
    price: 25000,
    standardPrice: 25000,
    regularPrice: 25000,
    currency: "ARS",
    listingTypeId: "gold_special",
    hasActivePromotion: false,
    promotionDiscountPercent: null,
    installmentLabel: null,
    attributes: [
      { id: "COLOR", name: "Color", value: color },
      { id: "SIZE", name: "Talle", value: size },
    ],
  };
}

function family(children: readonly PublicationWorkspaceItem[]): PublicationWorkspaceSelection {
  return {
    type: "family",
    familyId: "family-123",
    familyName: "Remera Mujer",
    imageUrl: null,
    children,
  };
}

describe("Publicación y promoción - paso 1 de desplegables", () => {
  beforeEach(() => {
    resetPromotionGlobalStore();
    mocks.table.mockClear();
    mocks.getPromotionOptions.mockReset();
  });
  afterEach(cleanup);

  it("muestra grupos cerrados y solo revela todos los talles al abrir cada color", async () => {
    const user = userEvent.setup();
    const children = [
      item("MLA101", "Negro", "S"),
      item("MLA102", "Negro", "M"),
      item("MLA103", "Blanco", "L"),
    ];
    render(
      <PublicationWorkspacePromotions
        selection={family(children)}
        visualOrder={createPublicationVisualOrder(children)}
      />,
    );

    expect(screen.getByRole("button", { name: "Abrir Negro" })).toHaveAttribute("aria-expanded", "false");
    expect(screen.getByRole("button", { name: "Abrir Blanco" })).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("list", { name: "Talles de Negro" })).not.toBeInTheDocument();
    expect(mocks.table).not.toHaveBeenCalled();
    expect(mocks.getPromotionOptions).not.toHaveBeenCalled();
    expect(screen.getByRole("img", { name: "Imagen de Negro" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Abrir Negro" }));

    expect(mocks.table).toHaveBeenCalledTimes(1);
    const negroPage = (mocks.table.mock.calls[0]?.[0] as {
      page: PromotionsPage;
      loadAllOnMount: boolean;
      directParticipation: boolean;
    });
    expect(negroPage.page.publications.map((publication) => publication.itemId))
      .toEqual(["MLA101", "MLA102"]);
    expect(negroPage.loadAllOnMount).toBe(true);
    expect(negroPage.directParticipation).toBe(true);
    expect(mocks.getPromotionOptions).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Cerrar Negro" }));
    expect(mocks.table).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole("button", { name: "Abrir Blanco" }));
    const blancoPage = (mocks.table.mock.calls.at(-1)?.[0] as { page: PromotionsPage });
    expect(blancoPage.page.publications.map((publication) => publication.itemId))
      .toEqual(["MLA103"]);
  });

  it("separa publicaciones blancas aunque Mercado Libre marque COLOR=Negro", async () => {
    const user = userEvent.setup();
    const negro = item("MLA900", "Negro", "S");
    const blanco = {
      ...item("MLA901", "Blanco", "M"),
      attributes: [
        { id: "COLOR", name: "Color", value: "Negro" },
        { id: "SIZE", name: "Talle", value: "M" },
      ],
    };
    const children = [negro, blanco];
    render(
      <PublicationWorkspacePromotions
        selection={family(children)}
        visualOrder={createPublicationVisualOrder(children)}
      />,
    );

    expect(screen.getByRole("button", { name: "Abrir Negro" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Abrir Blanco" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Abrir Blanco" }));
    const props = mocks.table.mock.calls.at(-1)?.[0] as { page: PromotionsPage };
    expect(props.page.publications.map((publication) => publication.itemId)).toEqual(["MLA901"]);
    expect(mocks.getPromotionOptions).not.toHaveBeenCalled();
  });

  it("mantiene el flujo existente para una publicación individual", () => {
    const publication = {
      ...item("MLA201", "Negro", "S"),
      familyId: null,
      model: "SHARED" as const,
    };
    render(
      <PublicationWorkspacePromotions
        selection={{ type: "publication", publication }}
        visualOrder={{}}
      />,
    );

    expect(mocks.table).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("button", { name: /Abrir Negro/u })).not.toBeInTheDocument();
  });
});
