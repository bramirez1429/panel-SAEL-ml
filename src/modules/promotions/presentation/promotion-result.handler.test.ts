import { describe, expect, it, vi } from "vitest";

import { handlePromotionCompletion } from "./promotion-result.handler";

function callbacks() {
  return {
    showSuccess: vi.fn(),
    showPartial: vi.fn(),
    close: vi.fn(),
    refresh: vi.fn(),
  };
}

describe("handlePromotionCompletion", () => {
  it("muestra parcial sin mensaje de éxito ni cerrar", () => {
    const handlers = callbacks();
    const result = {
      success: false,
      status: "PARTIAL_FAILURE" as const,
      totalItems: 8,
      successfulItems: 6,
      failedItems: 2,
      results: [],
    };

    expect(
      handlePromotionCompletion(result, "success", handlers),
    ).toBe("PARTIAL_FAILURE");
    expect(handlers.showPartial).toHaveBeenCalledWith(result);
    expect(handlers.showSuccess).not.toHaveBeenCalled();
    expect(handlers.close).not.toHaveBeenCalled();
    expect(handlers.refresh).not.toHaveBeenCalled();
  });

  it("sólo ante éxito total muestra éxito, cierra y refresca", () => {
    const handlers = callbacks();
    const result = {
      success: true,
      status: "SUCCESS" as const,
      totalItems: 1,
      successfulItems: 1,
      failedItems: 0,
      results: [],
    };

    expect(
      handlePromotionCompletion(result, "Promoción aplicada", handlers),
    ).toBe("SUCCESS");
    expect(handlers.showSuccess).toHaveBeenCalledWith("Promoción aplicada");
    expect(handlers.close).toHaveBeenCalledOnce();
    expect(handlers.refresh).toHaveBeenCalledOnce();
    expect(handlers.showPartial).not.toHaveBeenCalled();
  });
});
