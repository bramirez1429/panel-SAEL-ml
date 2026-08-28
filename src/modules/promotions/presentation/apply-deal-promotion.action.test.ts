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

  it("no llama apply cuando el preview no permite participar", async () => {
    mocks.preview.mockResolvedValue(preview(1, 0));

    const result = await applyDealPromotion(input);

    expect(result).toMatchObject({ ok: false });
    expect(mocks.preview).toHaveBeenCalledWith("item:MLA1", request);
    expect(mocks.apply).not.toHaveBeenCalled();
  });

  it("llama apply una sola vez y revalida cuando el preview es válido", async () => {
    mocks.preview.mockResolvedValue(preview(1, 1));
    mocks.apply.mockResolvedValue({
      success: true,
      status: "SUCCESS",
      totalItems: 1,
      successfulItems: 1,
      failedItems: 0,
      results: [],
    });

    await expect(applyDealPromotion(input)).resolves.toEqual({ ok: true });

    expect(mocks.apply).toHaveBeenCalledTimes(1);
    expect(mocks.apply).toHaveBeenCalledWith("item:MLA1", request);
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/promociones");
  });
});

function preview(totalItems: number, applicableItems: number) {
  return {
    sourceKey: "item:MLA1",
    totalItems,
    applicableItems,
    unavailableItems: totalItems - applicableItems,
    items: [],
  };
}
