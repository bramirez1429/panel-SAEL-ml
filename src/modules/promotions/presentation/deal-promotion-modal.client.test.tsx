import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { ApplyDealPromotionResult } from "./apply-deal-promotion.action";

const mocks = vi.hoisted(() => ({
  apply: vi.fn(),
  refresh: vi.fn(),
  success: vi.fn(),
}));

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: mocks.refresh }) }));
vi.mock("./apply-deal-promotion.action", () => ({ applyDealPromotion: mocks.apply }));
vi.mock("antd", async () => {
  const actual = await vi.importActual<typeof import("antd")>("antd");
  return { ...actual, message: { ...actual.message, success: mocks.success } };
});

import { DealPromotionModal } from "./deal-promotion-modal.client";

const campaign = {
  id: "DEAL-1",
  name: "Cyber Fest",
  type: "DEAL",
  status: "started",
  startDate: null,
  finishDate: null,
  deadlineDate: null,
} as const;

const item = {
  itemId: "MLA1",
  title: "Remera",
  thumbnail: null,
  sku: null,
  stock: null,
  freeShipping: null,
  installmentLabel: null,
  status: "candidate",
  eligible: true,
  currentPrice: 20_000,
  promotionPrice: null,
  minPromotionPrice: 3_400,
  maxPromotionPrice: 15_299,
  suggestedPromotionPrice: 14_449,
  requiresPriceSelection: true,
  sellerDiscountAmount: null,
  mercadoLibreBaseContributionAmount: 0,
  mercadoLibreBoostAmount: 0,
  mercadoLibreContributionAmount: 0,
  estimatedNetAmount: null,
} as const;

describe("DealPromotionModal", () => {
  beforeEach(() => {
    mocks.apply.mockReset();
    mocks.refresh.mockReset();
    mocks.success.mockReset();
  });
  afterEach(cleanup);

  it("usa el sugerido dentro del rango como valor inicial", () => {
    render(<DealPromotionModal campaign={campaign} item={item} onClose={vi.fn()} />);

    expect(screen.getByRole("spinbutton", { name: "Precio a aplicar" })).toHaveValue("14449");
    expect(screen.getByText(/3\.400.*15\.299/)).toBeInTheDocument();
  });

  it("valida mínimo y máximo y no permite confirmar un precio inválido", async () => {
    render(<DealPromotionModal campaign={campaign} item={item} onClose={vi.fn()} />);
    const input = screen.getByRole("spinbutton", { name: "Precio a aplicar" });
    const confirm = screen.getByRole("button", { name: "Confirmar" });

    fireEvent.change(input, { target: { value: "3000" } });
    await waitFor(() => expect(confirm).toBeDisabled());
    expect(screen.getByText(/precio mínimo/)).toBeInTheDocument();

    fireEvent.change(input, { target: { value: "16000" } });
    await waitFor(() => expect(screen.getByText(/precio máximo/)).toBeInTheDocument());
    expect(confirm).toBeDisabled();

    fireEvent.change(input, { target: { value: "" } });
    await waitFor(() => expect(screen.getByText("Ingresá un precio.")).toBeInTheDocument());
    expect(mocks.apply).not.toHaveBeenCalled();
  });

  it("mantiene el modal abierto y muestra el error del preflight", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    mocks.apply.mockResolvedValue({ ok: false, message: "La publicación ya no está disponible." });
    render(<DealPromotionModal campaign={campaign} item={item} onClose={onClose} />);

    await user.click(screen.getByRole("button", { name: "Confirmar" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("La publicación ya no está disponible.");
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("un éxito cierra, notifica y refresca promociones", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    mocks.apply.mockResolvedValue({ ok: true });
    render(<DealPromotionModal campaign={campaign} item={item} onClose={onClose} />);

    await user.click(screen.getByRole("button", { name: "Confirmar" }));

    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
    expect(mocks.apply).toHaveBeenCalledWith({ itemId: "MLA1", promotionId: "DEAL-1", dealPrice: 14_449 });
    expect(mocks.apply).toHaveBeenCalledTimes(1);
    expect(mocks.success).toHaveBeenCalledWith("Promoción aplicada correctamente.");
    expect(mocks.refresh).toHaveBeenCalledTimes(1);
  });

  it("loading evita un doble submit", async () => {
    let resolveAction: (result: ApplyDealPromotionResult) => void = () => undefined;
    mocks.apply.mockReturnValue(new Promise<ApplyDealPromotionResult>((resolve) => {
      resolveAction = resolve;
    }));
    render(<DealPromotionModal campaign={campaign} item={item} onClose={vi.fn()} />);
    const confirm = screen.getByRole("button", { name: "Confirmar" });

    fireEvent.click(confirm);
    fireEvent.click(confirm);

    expect(mocks.apply).toHaveBeenCalledTimes(1);
    expect(confirm).toBeDisabled();
    resolveAction({ ok: false, message: "Error controlado" });
    await screen.findByRole("alert");
  });
});
