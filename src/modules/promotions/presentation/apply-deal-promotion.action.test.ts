import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  apply: vi.fn(),
  preview: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("../promotions.composition.server", () => ({
  createPromotionsRepository: () => ({ apply: mocks.apply, preview: mocks.preview }),
}));

import { applyDealPromotion } from "./apply-deal-promotion.action";

const input = { itemId: "MLA1", promotionId: "DEAL-1", dealPrice: 14_449 } as const;
const request = { type: "DEAL", promotionId: "DEAL-1", dealPrice: 14_449 } as const;

describe("applyDealPromotion", () => {
  beforeEach(() => {
    mocks.apply.mockReset();
    mocks.preview.mockReset();
    mocks.revalidatePath.mockReset();
  });

  it("no llama preview y aplica al sourceKey item:MLA", async () => {
    mocks.apply.mockResolvedValue(successResult());

    const result = await applyDealPromotion(input);

    expect(result).toEqual({ ok: true });
    expect(mocks.preview).not.toHaveBeenCalled();
    expect(mocks.apply).toHaveBeenCalledWith("item:MLA1", request);
  });

  it("llama apply una sola vez y revalida", async () => {
    mocks.apply.mockResolvedValue(successResult());

    await expect(applyDealPromotion(input)).resolves.toEqual({ ok: true });

    expect(mocks.apply).toHaveBeenCalledTimes(1);
    expect(mocks.preview).not.toHaveBeenCalled();
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/promociones");
  });
});

function successResult() {
  return {
    success: true,
    status: "SUCCESS",
    totalItems: 1,
    successfulItems: 1,
    failedItems: 0,
    results: [],
  };
}
