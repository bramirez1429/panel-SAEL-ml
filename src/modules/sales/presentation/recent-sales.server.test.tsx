// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  repository: {},
  createRepository: vi.fn(),
  getRecent: vi.fn(),
  rethrow: vi.fn(),
}));

vi.mock("next/navigation", () => ({ unstable_rethrow: mocks.rethrow }));
vi.mock("../application/get-recent-sales", () => ({ getRecentSales: mocks.getRecent }));
vi.mock("../sales.composition.server", () => ({ createSalesRepository: mocks.createRepository }));
vi.mock("./sales-list.client", () => ({ SalesList: () => null }));

import { RecentSales } from "./recent-sales.server";

describe("RecentSales", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.createRepository.mockReturnValue(mocks.repository);
  });

  it("vuelve a lanzar redirects de Next.js al cargar ventas", async () => {
    const redirectError = new Error("redirect");
    mocks.getRecent.mockRejectedValue(redirectError);
    mocks.rethrow.mockImplementation((error: unknown) => {
      if (error === redirectError) throw error;
    });
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);

    await expect(RecentSales()).rejects.toBe(redirectError);

    expect(mocks.rethrow).toHaveBeenCalledWith(redirectError);
    expect(mocks.getRecent).toHaveBeenCalledWith(mocks.repository, 24);
    expect(consoleError).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it("solicita las ventas de las ultimas 24 horas sin sincronizacion bloqueante", async () => {
    const savedSales = { hours: 24, items: [] };
    mocks.getRecent.mockResolvedValue(savedSales);

    await expect(RecentSales()).resolves.toBeDefined();

    expect(mocks.getRecent).toHaveBeenCalledWith(mocks.repository, 24);
    expect(mocks.rethrow).not.toHaveBeenCalled();
  });
});
