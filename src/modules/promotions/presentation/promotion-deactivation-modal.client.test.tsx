import { message } from "antd";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { PromotionRow } from "../domain/promotion.model";
import type { PromotionOption } from "../domain/promotions.repository";
import { resetPromotionGlobalStore, usePromotionGlobalStore } from "./promotion-global.store";

const mocks = vi.hoisted(() => ({ deactivate: vi.fn(), refresh: vi.fn() }));

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: mocks.refresh }) }));
vi.mock("./deactivate-selected-promotion.action", () => ({
  deactivateSelectedPromotion: mocks.deactivate,
}));

import { PromotionDeactivationModal } from "./promotion-deactivation-modal.client";

describe("PromotionDeactivationModal", () => {
  beforeEach(() => {
    resetPromotionGlobalStore();
    mocks.deactivate.mockReset();
    mocks.refresh.mockReset();
    vi.spyOn(message, "success");
  });
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("envía la opción exacta, invalida sólo el MLA y refresca", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const option = removableOption();
    usePromotionGlobalStore.setState({
      optionsByItem: {
        MLA1: { status: "success", options: [option] },
        MLA2: { status: "success", options: [] },
      },
    });
    mocks.deactivate.mockResolvedValue({ ok: true, result: successResult() });

    render(<PromotionDeactivationModal
      selection={{ publication: publication(), option }}
      open
      onClose={onClose}
    />);
    await user.click(screen.getByRole("button", { name: "Dejar de participar" }));

    await waitFor(() => expect(mocks.deactivate).toHaveBeenCalledWith({ itemId: "MLA1", option }));
    expect(usePromotionGlobalStore.getState().optionsByItem.MLA1).toBeUndefined();
    expect(usePromotionGlobalStore.getState().optionsByItem.MLA2).toBeDefined();
    expect(onClose).toHaveBeenCalledOnce();
    expect(mocks.refresh).toHaveBeenCalledOnce();
    expect(message.success).toHaveBeenCalledOnce();
  });

  it("mantiene el modal abierto y no muestra éxito cuando falla", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    mocks.deactivate.mockResolvedValue({
      ok: false,
      message: "No se pudo quitar. Mercado Libre: rejected",
      diagnosticCode: "PROMOTION_REMOVAL_FAILED",
    });

    render(<PromotionDeactivationModal
      selection={{ publication: publication(), option: removableOption() }}
      open
      onClose={onClose}
    />);
    await user.click(screen.getByRole("button", { name: "Dejar de participar" }));

    expect(await screen.findByText(/Mercado Libre: rejected/)).toBeInTheDocument();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
    expect(mocks.refresh).not.toHaveBeenCalled();
    expect(message.success).not.toHaveBeenCalled();
  });
});

function publication(): PromotionRow {
  return {
    itemId: "MLA1", familyId: "123456", title: "Remera", thumbnail: null,
    productGroup: "WOMEN_TSHIRT", price: 20_000, currentPromotion: null,
    hasActivePromotion: true, availablePromotionsCount: 0, promotionStatus: "ACTIVE",
  };
}

function removableOption(): PromotionOption {
  return {
    id: "P1", offerId: null, type: "DEAL", name: "Cyber Fest", status: "started",
    originalPrice: 20_000, promotionPrice: 15_000, minPromotionPrice: null,
    maxPromotionPrice: null, suggestedPromotionPrice: null, requiresPriceSelection: false,
    discountPercent: null, sellerDiscountAmount: null,
    mercadoLibreBaseContributionAmount: null, mercadoLibreBoostAmount: null,
    mercadoLibreContributionAmount: null, estimatedNetAmount: null,
    suggestedEstimatedNetAmount: null, startDate: null, finishDate: null,
    canApply: false, canRemove: true, saleEstimate: null,
  };
}

function successResult() {
  return {
    success: true, status: "SUCCESS", totalItems: 1,
    successfulItems: 1, failedItems: 0, results: [],
  };
}
