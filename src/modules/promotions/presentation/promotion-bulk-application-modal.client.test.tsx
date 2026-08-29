import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { PromotionOption } from "../domain/promotions.repository";

const mocks = vi.hoisted(() => ({
  apply: vi.fn(),
  getOptions: vi.fn(),
  refresh: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: mocks.refresh,
  }),
}));

vi.mock("./apply-selected-promotion.action", () => ({
  applySelectedPromotion: mocks.apply,
}));

vi.mock("./promotion-options.action", () => ({
  getPromotionOptions: mocks.getOptions,
}));

import { PromotionBulkApplicationModal } from "./promotion-bulk-application-modal.client";
import {
  resetPromotionGlobalStore,
  type SelectedPromotion,
} from "./promotion-global.store";

describe("PromotionBulkApplicationModal", () => {
  beforeEach(() => {
    resetPromotionGlobalStore();
    mocks.apply.mockReset();
    mocks.getOptions.mockReset();
    mocks.refresh.mockReset();
    mocks.getOptions.mockResolvedValue([]);
  });

  afterEach(() => {
    cleanup();
  });

  it("continúa con la siguiente promoción aunque una ejecución lance error", async () => {
    const user = userEvent.setup();

    mocks.apply
      .mockResolvedValueOnce({ ok: true })
      .mockRejectedValueOnce(new Error("falló transporte"))
      .mockResolvedValueOnce({ ok: true });

    render(
      <PromotionBulkApplicationModal
        selections={[
          selection("MLA1"),
          selection("MLA2"),
          selection("MLA3"),
        ]}
        onClose={vi.fn()}
      />,
    );

    await user.click(
      screen.getByRole("button", {
        name: "Participar en 3 promociones",
      }),
    );

    expect(
      await screen.findByText("2 aplicadas · 1 con error"),
    ).toBeInTheDocument();

    expect(mocks.apply).toHaveBeenCalledTimes(3);

    expect(mocks.apply.mock.calls.map((call) => call[0].itemId)).toEqual([
      "MLA1",
      "MLA2",
      "MLA3",
    ]);

    expect(mocks.refresh).toHaveBeenCalledTimes(1);
  });
});

function selection(itemId: string): SelectedPromotion {
  return {
    key: `${itemId}::DEAL::P-${itemId}::`,
    itemId,
    familyId: null,
    publicationTitle: `Publicación ${itemId}`,
    option: option(itemId),
  };
}

function option(itemId: string): PromotionOption {
  return {
    id: `P-${itemId}`,
    offerId: null,
    type: "DEAL",
    name: "Cyber Fest",
    status: "candidate",
    originalPrice: 100,
    promotionPrice: 90,
    minPromotionPrice: 50,
    maxPromotionPrice: 95,
    suggestedPromotionPrice: null,
    requiresPriceSelection: false,
    discountPercent: 10,
    sellerDiscountAmount: 10,
    mercadoLibreBaseContributionAmount: 0,
    mercadoLibreBoostAmount: null,
    mercadoLibreContributionAmount: 0,
    estimatedNetAmount: 70,
    suggestedEstimatedNetAmount: null,
    startDate: null,
    finishDate: null,
    canApply: true,
    canRemove: false,
    saleEstimate: null,
  };
}
