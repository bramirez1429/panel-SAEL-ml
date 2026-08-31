import { beforeEach, describe, expect, it, vi } from "vitest";

import type { PromotionOption } from "../domain/promotions.repository";

const mocks = vi.hoisted(() => ({ removeSelected: vi.fn(), revalidatePath: vi.fn() }));

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("../promotions.composition.server", () => ({
  createPromotionsRepository: () => ({ removeSelected: mocks.removeSelected }),
}));

import { deactivateSelectedPromotion } from "./deactivate-selected-promotion.action";

describe("deactivateSelectedPromotion", () => {
  beforeEach(() => {
    mocks.removeSelected.mockReset();
    mocks.revalidatePath.mockReset();
    mocks.removeSelected.mockResolvedValue(successResult());
  });

  it.each(["started", "pending"])("elimina un DEAL %s solamente por item:MLA", async (status) => {
    const option = removableOption({ status });

    await expect(deactivateSelectedPromotion({ itemId: "MLA1", option })).resolves.toMatchObject({ ok: true });

    expect(mocks.removeSelected).toHaveBeenCalledWith("item:MLA1", {
      promotionType: "DEAL",
      promotionId: "P1",
      offerId: null,
    });
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/promociones");
  });

  it("conserva el rechazo y motivo real sin revalidar", async () => {
    mocks.removeSelected.mockResolvedValue({
      success: false,
      status: "FAILURE",
      errorCode: "PROMOTION_REMOVAL_FAILED",
      providerMessage: "promotion cannot be removed",
      totalItems: 1,
      successfulItems: 0,
      failedItems: 1,
      results: [],
    });

    const result = await deactivateSelectedPromotion({ itemId: "MLA1", option: removableOption() });

    expect(result).toEqual({
      ok: false,
      diagnosticCode: "PROMOTION_REMOVAL_FAILED",
      message: expect.stringContaining("promotion cannot be removed"),
    });
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });

  it("no ejecuta una opción sin permiso de baja", async () => {
    const result = await deactivateSelectedPromotion({
      itemId: "MLA1",
      option: removableOption({ canRemove: false }),
    });

    expect(result).toMatchObject({ ok: false });
    expect(mocks.removeSelected).not.toHaveBeenCalled();
  });
});

function removableOption(overrides: Partial<PromotionOption> = {}): PromotionOption {
  return {
    id: "P1", offerId: null, type: "DEAL", name: "Cyber Fest", status: "started",
    originalPrice: 20_000, promotionPrice: 15_000, minPromotionPrice: null,
    maxPromotionPrice: null, suggestedPromotionPrice: null, requiresPriceSelection: false,
    discountPercent: null, sellerDiscountAmount: null,
    mercadoLibreBaseContributionAmount: null, mercadoLibreBoostAmount: null,
    mercadoLibreContributionAmount: null, estimatedNetAmount: null,
    suggestedEstimatedNetAmount: null, startDate: null, finishDate: null,
    canApply: false, canRemove: true, saleEstimate: null, ...overrides,
  };
}

function successResult() {
  return {
    success: true, status: "SUCCESS", totalItems: 1,
    successfulItems: 1, failedItems: 0, results: [],
  };
}
