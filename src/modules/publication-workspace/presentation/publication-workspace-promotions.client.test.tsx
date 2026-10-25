import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type {
  PublicationWorkspaceItem,
  PublicationWorkspaceSelection,
} from "../domain/publication-workspace.model";
import { createPublicationVisualOrder } from "@/shared/lib/publication-variant";
import { resetPromotionGlobalStore } from "@/modules/promotions/presentation/promotion-global.store";

const mocks = vi.hoisted(() => ({
  table: vi.fn(() => null),
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
    thumbnailUrl: null,
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

    await user.click(screen.getByRole("button", { name: "Abrir Negro" }));

    const negro = screen.getByRole("list", { name: "Talles de Negro" });
    expect(within(negro).getAllByRole("listitem")).toHaveLength(2);
    expect(within(negro).getByText("Talle S")).toBeInTheDocument();
    expect(within(negro).getByText("Talle M")).toBeInTheDocument();
    expect(screen.queryByRole("list", { name: "Talles de Blanco" })).not.toBeInTheDocument();
    expect(mocks.table).not.toHaveBeenCalled();
    expect(mocks.getPromotionOptions).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Cerrar Negro" }));
    expect(screen.queryByRole("list", { name: "Talles de Negro" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Abrir Blanco" }));
    expect(within(screen.getByRole("list", { name: "Talles de Blanco" })).getByText("Talle L"))
      .toBeInTheDocument();
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
