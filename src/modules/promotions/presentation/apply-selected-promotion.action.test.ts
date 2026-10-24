import { beforeEach, describe, expect, it, vi } from "vitest";

import type { PromotionOption } from "../domain/promotions.repository";

const mocks = vi.hoisted(() => ({ apply: vi.fn(), updatePrice: vi.fn(), preview: vi.fn(), revalidatePath: vi.fn() }));

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("../promotions.composition.server", () => ({
  createPromotionsRepository: () => ({ apply: mocks.apply, updatePrice: mocks.updatePrice, preview: mocks.preview }),
}));

import { applySelectedPromotion } from "./apply-selected-promotion.action";

describe("applySelectedPromotion", () => {
  beforeEach(() => {
    mocks.apply.mockReset();
    mocks.updatePrice.mockReset();
    mocks.preview.mockReset();
    mocks.revalidatePath.mockReset();
  });

  it("no llama preview y mantiene sourceKey item:MLA", async () => {
    mocks.apply.mockResolvedValue(successResult());

    const result = await applySelectedPromotion({ itemId: "MLA1", option: dealOption(), selectedPrice: 14_449 });

    expect(result).toEqual({ ok: true, confirmedPrice: 14_449 });
    expect(mocks.preview).not.toHaveBeenCalled();
    expect(mocks.apply).toHaveBeenCalledWith("item:MLA1", expect.any(Object));
  });

  it("usa el precio elegido, ejecuta apply una vez y revalida", async () => {
    mocks.apply.mockResolvedValue(successResult());

    await expect(applySelectedPromotion({ itemId: "MLA1", option: dealOption(), selectedPrice: 14_449 })).resolves.toEqual({ ok: true, confirmedPrice: 14_449 });

    const request = { type: "DEAL", promotionId: "P-1", dealPrice: 14_449 };
    expect(mocks.preview).not.toHaveBeenCalled();
    expect(mocks.apply).toHaveBeenCalledWith("item:MLA1", request);
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/promociones");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/publicacion-promocion");
  });

  it("rechaza un precio fuera del rango antes de apply", async () => {
    const result = await applySelectedPromotion({ itemId: "MLA1", option: dealOption(), selectedPrice: 99 });

    expect(result).toMatchObject({ ok: false });
    expect(mocks.preview).not.toHaveBeenCalled();
    expect(mocks.apply).not.toHaveBeenCalled();
  });

  it("usa promotionPrice real cuando la opción no requiere elegir precio", async () => {
    mocks.apply.mockResolvedValue({
      ...successResult(),
      results: [{ itemId: "MLA1", success: true, stage: "APPLICATION", confirmedPrice: 12_000 }],
    });
    const fixedPriceOption = { ...dealOption(), promotionPrice: 12_000, requiresPriceSelection: false };

    await expect(applySelectedPromotion({ itemId: "MLA1", option: fixedPriceOption, selectedPrice: null }))
      .resolves.toEqual({ ok: false, message: "El precio elegido no es válido." });

    expect(mocks.apply).not.toHaveBeenCalled();
  });

  it.each([
    ["PROMOTION_APPLICATION_FAILED", "No se pudo aplicar la promoción completa."],
    ["PROMOTION_PARTIAL_FAILURE", "La promoción se aplicó sólo a parte de la publicación."],
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

  it("rechaza una respuesta exitosa que no confirma el MLA aplicado", async () => {
    mocks.apply.mockResolvedValue({
      ...successResult(),
      results: [],
    });

    await expect(applySelectedPromotion({ itemId: "MLA1", option: dealOption(), selectedPrice: 14_449 }))
      .resolves.toEqual({
        ok: false,
        message: expect.stringContaining("todavía no confirmó el precio promocional"),
        diagnosticCode: "PROMOTION_VERIFICATION_PENDING",
      });
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });

  it("no vuelve a enviar el mismo precio de una promoción existente", async () => {
    const option = {
      ...dealOption(),
      status: "started",
      canRemove: true,
      promotionPrice: 12_000,
      canUpdatePrice: true,
      priceModification: { operation: "UPDATE", allowed: true, reason: null },
    } satisfies PromotionOption;

    await expect(applySelectedPromotion({ itemId: "MLA1", option, selectedPrice: 12_000 }))
      .resolves.toEqual({ ok: false, message: "El precio elegido no es válido." });
    expect(mocks.apply).not.toHaveBeenCalled();
    expect(mocks.updatePrice).not.toHaveBeenCalled();
  });

  it("usa UPDATE_PRICE con el valor solicitado para una promoción activa", async () => {
    mocks.updatePrice.mockResolvedValue({
      ...successResult(),
      results: [{ itemId: "MLA1", success: true, stage: "UPDATE_PRICE", confirmedPrice: 68_999 }],
    });
    const option = dealOption({
      status: "started",
      canRemove: true,
      canUpdatePrice: true,
      promotionPrice: 71_911.2,
      minPromotionPrice: 60_000,
      maxPromotionPrice: 72_000,
    });

    await expect(applySelectedPromotion({ itemId: "MLA1", option, selectedPrice: 68_999 }))
      .resolves.toEqual({ ok: true, confirmedPrice: 68_999 });

    expect(mocks.updatePrice).toHaveBeenCalledWith("item:MLA1", {
      type: "DEAL",
      promotionId: "P-1",
      dealPrice: 68_999,
    });
    expect(mocks.apply).not.toHaveBeenCalled();
  });

  it("rechaza el éxito cuando Mercado Libre confirma otro precio", async () => {
    mocks.apply.mockResolvedValue({
      ...successResult(),
      results: [{ itemId: "MLA1", success: true, stage: "APPLICATION", confirmedPrice: 71_911 }],
    });

    await expect(applySelectedPromotion({
      itemId: "MLA1",
      option: dealOption({ minPromotionPrice: 60_000, maxPromotionPrice: 72_000 }),
      selectedPrice: 68_000,
    }))
      .resolves.toEqual({
        ok: false,
        message: expect.stringContaining("nuevo precio promocional"),
        diagnosticCode: "PROMOTION_PRICE_NOT_CONFIRMED",
      });
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });
});

function dealOption(overrides: Partial<PromotionOption> = {}): PromotionOption {
  return {
    id: "P-1", offerId: null, type: "DEAL", name: "Cyber Fest", status: "candidate", originalPrice: 20_000, promotionPrice: null, minPromotionPrice: 100, maxPromotionPrice: 15_000, suggestedPromotionPrice: 14_449, requiresPriceSelection: true, discountPercent: null, sellerDiscountAmount: null, mercadoLibreBaseContributionAmount: 0, mercadoLibreBoostAmount: 0, mercadoLibreContributionAmount: 0, estimatedNetAmount: null, suggestedEstimatedNetAmount: null, startDate: null, finishDate: null, canApply: true, canRemove: false, saleEstimate: null,
    ...overrides,
  };
}

function successResult() {
  return { success: true, status: "SUCCESS", totalItems: 1, successfulItems: 1, failedItems: 0, results: [{ itemId: "MLA1", success: true, stage: "APPLICATION", confirmedPrice: 14_449 }] };
}
