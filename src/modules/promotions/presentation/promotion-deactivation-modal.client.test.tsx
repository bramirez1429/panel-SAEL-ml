import { message } from "antd";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
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

  it.each([
    ["started", "Se quitará la publicación de esta promoción activa."],
    ["pending", "Se cancelará la participación programada."],
  ])("muestra una sola confirmación para status %s", (status, description) => {
    render(<PromotionDeactivationModal
      selection={{ publication: publication(), option: removableOption({ status }) }}
      open
      onClose={vi.fn()}
    />);

    expect(screen.getAllByRole("dialog")).toHaveLength(1);
    expect(screen.getByText("Cyber Fest")).toBeInTheDocument();
    expect(screen.getByText("MLA1")).toBeInTheDocument();
    expect(screen.getByText(description)).toBeInTheDocument();
  });

  it("mantiene el mismo modal cargando y evita doble ejecución", async () => {
    let finish: (value: Readonly<{ ok: false; message: string }>) => void = () => undefined;
    mocks.deactivate.mockReturnValue(new Promise((resolve) => { finish = resolve; }));
    render(<PromotionDeactivationModal
      selection={{ publication: publication(), option: removableOption() }}
      open
      onClose={vi.fn()}
    />);
    const confirm = screen.getByRole("button", { name: "Dejar de participar" });

    fireEvent.click(confirm);
    fireEvent.click(confirm);

    expect(await screen.findByText("Dejando de participar...")).toBeInTheDocument();
    expect(screen.getAllByRole("dialog")).toHaveLength(1);
    expect(screen.queryByRole("button", { name: "Cancelar" })).not.toBeInTheDocument();
    expect(mocks.deactivate).toHaveBeenCalledTimes(1);
    finish({ ok: false, message: "Error temporal" });
    expect(await screen.findByRole("button", { name: "Reintentar" })).toBeInTheDocument();
  });

  it("en éxito invalida sólo el MLA, refresca, cierra y muestra el mensaje final", async () => {
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
    render(<ControlledModal option={option} onClose={onClose} />);

    await user.click(screen.getByRole("button", { name: "Dejar de participar" }));

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(mocks.deactivate).toHaveBeenCalledWith({ itemId: "MLA1", option });
    expect(usePromotionGlobalStore.getState().optionsByItem.MLA1).toBeUndefined();
    expect(usePromotionGlobalStore.getState().optionsByItem.MLA2).toBeDefined();
    expect(mocks.refresh).toHaveBeenCalledOnce();
    expect(onClose).toHaveBeenCalledOnce();
    expect(message.success).toHaveBeenCalledWith("Dejaste de participar de la promoción.");
  });

  it("muestra el error técnico dentro del mismo modal y permite un único reintento", async () => {
    const user = userEvent.setup();
    mocks.deactivate
      .mockResolvedValueOnce({
        ok: false,
        message: "Mercado Libre no está disponible temporalmente.",
        diagnosticCode: "PROMOTION_PROVIDER_UNAVAILABLE",
      })
      .mockResolvedValueOnce({ ok: false, message: "Continúa no disponible" });
    render(<PromotionDeactivationModal
      selection={{ publication: publication(), option: removableOption() }}
      open
      onClose={vi.fn()}
    />);

    await user.click(screen.getByRole("button", { name: "Dejar de participar" }));

    expect(await screen.findByText("Mercado Libre no está disponible temporalmente.")).toBeInTheDocument();
    expect(screen.getByText(/PROMOTION_PROVIDER_UNAVAILABLE/)).toBeInTheDocument();
    expect(screen.getAllByRole("dialog")).toHaveLength(1);
    expect(message.success).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Reintentar" }));
    await waitFor(() => expect(mocks.deactivate).toHaveBeenCalledTimes(2));
  });
});

function ControlledModal({ option, onClose }: Readonly<{
  option: PromotionOption;
  onClose: () => void;
}>) {
  const [open, setOpen] = useState(true);
  if (!open) return null;
  return <PromotionDeactivationModal
    selection={{ publication: publication(), option }}
    open={open}
    onClose={() => {
      onClose();
      setOpen(false);
    }}
  />;
}

function publication(): PromotionRow {
  return {
    itemId: "MLA1", familyId: "123456", title: "Remera", thumbnail: null,
    sku: null, stock: null, freeShipping: null, installmentLabel: null,
    productGroup: "WOMEN_TSHIRT", price: 20_000, currentPromotion: null,
    hasActivePromotion: true, availablePromotionsCount: 0, promotionStatus: "ACTIVE",
  };
}

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
