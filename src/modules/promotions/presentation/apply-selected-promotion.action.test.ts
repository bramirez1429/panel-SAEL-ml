import { beforeEach, describe, expect, it, vi } from "vitest";

import type { PromotionOption } from "../domain/promotions.repository";

const mocks = vi.hoisted(() => ({ apply: vi.fn(), preview: vi.fn(), revalidatePath: vi.fn() }));

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("../promotions.composition.server", () => ({
  createPromotionsRepository: () => ({ apply: mocks.apply, preview: mocks.preview }),
}));

import { applySelectedPromotion } from "./apply-selected-promotion.action";

describe("applySelectedPromotion", () => {
  beforeEach(() => {
    mocks.apply.mockReset();
    mocks.preview.mockReset();
    mocks.revalidatePath.mockReset();
  });

  it("no llama preview y mantiene sourceKey item:MLA", async () => {
    mocks.apply.mockResolvedValue(successResult());

    const result = await applySelectedPromotion({ itemId: "MLA1", option: dealOption(), selectedPrice: 14_449 });

    expect(result).toEqual({ ok: true });
    expect(mocks.preview).not.toHaveBeenCalled();
    expect(mocks.apply).toHaveBeenCalledWith("item:MLA1", expect.any(Object));
  });

  it("usa el precio elegido, ejecuta apply una vez y revalida", async () => {
    mocks.apply.mockResolvedValue(successResult());

    await expect(applySelectedPromotion({ itemId: "MLA1", option: dealOption(), selectedPrice: 14_449 })).resolves.toEqual({ ok: true });

    const request = { type: "DEAL", promotionId: "P-1", dealPrice: 14_449 };
    expect(mocks.preview).not.toHaveBeenCalled();
    expect(mocks.apply).toHaveBeenCalledWith("item:MLA1", request);
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/promociones");
  });

  it("rechaza un precio fuera del rango antes de apply", async () => {
    const result = await applySelectedPromotion({ itemId: "MLA1", option: dealOption(), selectedPrice: 99 });

    expect(result).toMatchObject({ ok: false });
    expect(mocks.preview).not.toHaveBeenCalled();
    expect(mocks.apply).not.toHaveBeenCalled();
  });

  it("usa promotionPrice real cuando la opción no requiere elegir precio", async () => {
    mocks.apply.mockResolvedValue(successResult());
    const fixedPriceOption = { ...dealOption(), promotionPrice: 12_000, requiresPriceSelection: false };

    await expect(applySelectedPromotion({ itemId: "MLA1", option: fixedPriceOption, selectedPrice: null })).resolves.toEqual({ ok: true });

    expect(mocks.apply).toHaveBeenCalledWith("item:MLA1", { type: "DEAL", promotionId: "P-1", dealPrice: 12_000 });
  });

  it.each([
    ["PROMOTION_APPLICATION_FAILED", "No se pudo aplicar la promoción completa."],
    ["PROMOTION_VERIFICATION_FAILED", "No pudimos confirmar el estado final de la promoción."],
    ["PROMOTION_CHANGED_DURING_OPERATION", "Mercado Libre modificó la disponibilidad de esta promoción. Volvé a consultar."],
  ])("conserva el error específico de apply: %s", async (errorCode, message) => {
    mocks.apply.mockResolvedValue({ success: false, status: "FAILURE", errorCode, totalItems: 1, successfulItems: 0, failedItems: 1, results: [] });

    await expect(applySelectedPromotion({ itemId: "MLA1", option: dealOption(), selectedPrice: 14_449 }))
      .resolves.toEqual({ ok: false, message, diagnosticCode: errorCode });
    expect(mocks.apply).toHaveBeenCalledTimes(1);
  });

  it("incluye el rechazo real de Mercado Libre sin perder el mensaje amigable", async () => {
    mocks.apply.mockResolvedValue({
      success: false,
      status: "FAILURE",
      errorCode: "PROMOTION_APPLICATION_FAILED",
      providerMessage: "invalid deal price",
      totalItems: 1,
      successfulItems: 0,
      failedItems: 1,
      results: [{
        itemId: "MLA1",
        success: false,
        stage: "APPLICATION",
        errorCode: "PROMOTION_APPLICATION_FAILED",
        providerMessage: "invalid deal price",
      }],
    });

    const result = await applySelectedPromotion({ itemId: "MLA1", option: dealOption(), selectedPrice: 14_449 });

    expect(result).toEqual({
      ok: false,
      diagnosticCode: "PROMOTION_APPLICATION_FAILED",
      message: expect.stringContaining("invalid deal price"),
    });
    if (result.ok) throw new Error("Se esperaba un rechazo");
    expect(result.message).toContain("No se pudo aplicar la promoción completa.");
    expect(result.message).toContain("Mercado Libre: invalid deal price");
  });
});

function dealOption(): PromotionOption {
  return { id: "P-1", offerId: null, type: "DEAL", name: "Cyber Fest", status: "candidate", originalPrice: 20_000, promotionPrice: null, minPromotionPrice: 100, maxPromotionPrice: 15_000, suggestedPromotionPrice: 14_449, requiresPriceSelection: true, discountPercent: null, sellerDiscountAmount: null, mercadoLibreBaseContributionAmount: 0, mercadoLibreBoostAmount: 0, mercadoLibreContributionAmount: 0, estimatedNetAmount: null, suggestedEstimatedNetAmount: null, startDate: null, finishDate: null, canApply: true, canRemove: false, saleEstimate: null };
}

function successResult() {
  return { success: true, status: "SUCCESS", totalItems: 1, successfulItems: 1, failedItems: 0, results: [] };
}
