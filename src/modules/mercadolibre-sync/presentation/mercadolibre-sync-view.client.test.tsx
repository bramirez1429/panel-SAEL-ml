import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { MercadolibreSyncView, syncPercent } from "./mercadolibre-sync-view.client";

const pending = {
  ok: true as const,
  syncId: "sync-1",
  status: "PENDING" as const,
  totalItems: 10,
  processedItems: 2,
  productsSaved: 1,
  childrenSaved: 3,
  errorsCount: 0,
  lastError: null,
  hasMore: true,
};

afterEach(() => {
  cleanup();
  window.localStorage.clear();
  vi.useRealTimers();
});

describe("syncPercent", () => {
  it("calcula y limita el porcentaje", () => {
    expect(syncPercent({ processedItems: 5, totalItems: 10 })).toBe(50);
    expect(syncPercent({ processedItems: 0, totalItems: 0 })).toBe(0);
    expect(syncPercent({ processedItems: 15, totalItems: 10 })).toBe(100);
  });
});

describe("MercadolibreSyncView", () => {
  it("muestra el estado inicial", () => {
    render(<MercadolibreSyncView startAction={vi.fn()} getStatusAction={vi.fn()} />);

    expect(screen.getByText("Sincronización de Mercado Libre")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sincronizar ahora" })).toBeInTheDocument();
  });

  it("muestra PENDING/RUNNING y consulta el estado por polling", async () => {
    vi.useFakeTimers();
    const startAction = vi.fn().mockResolvedValue(pending);
    const completed = { ...pending, status: "COMPLETED" as const, processedItems: 10 };
    const getStatusAction = vi.fn().mockResolvedValue(completed);
    render(<MercadolibreSyncView startAction={startAction} getStatusAction={getStatusAction} />);

    await act(async () => { await screen.getByRole("button", { name: "Sincronizar ahora" }).click(); });
    expect(screen.getByText("Sincronizando publicaciones...")).toBeInTheDocument();
    expect(screen.getByText("2 de 10 publicaciones")).toBeInTheDocument();

    await act(async () => { vi.advanceTimersByTime(3000); });
    expect(getStatusAction).toHaveBeenCalledWith("sync-1");
  });

  it("muestra COMPLETED al 100% y permite sincronizar nuevamente", async () => {
    const completed = { ...pending, status: "COMPLETED" as const, processedItems: 10 };
    render(<MercadolibreSyncView startAction={vi.fn().mockResolvedValue(completed)} getStatusAction={vi.fn()} />);

    await act(async () => { await screen.getByRole("button", { name: "Sincronizar ahora" }).click(); });

    expect(screen.getByText("Sincronización completada")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sincronizar nuevamente" })).toBeEnabled();
  });

  it("muestra el estado FAILED sin exponer el error técnico", async () => {
    const failed = { ...pending, status: "FAILED" as const, lastError: "token secreto" };
    render(<MercadolibreSyncView startAction={vi.fn().mockResolvedValue(failed)} getStatusAction={vi.fn()} />);

    await act(async () => { await screen.getByRole("button", { name: "Sincronizar ahora" }).click(); });

    expect(screen.getByText("La sincronización no pudo completarse. Intentá nuevamente.")).toBeInTheDocument();
    expect(screen.queryByText("token secreto")).not.toBeInTheDocument();
  });

  it("restaura el syncId guardado y retoma el progreso", async () => {
    window.localStorage.setItem("mercadolibre-publication-sync-id", "sync-restored");
    const getStatusAction = vi.fn().mockResolvedValue(pending);
    render(<MercadolibreSyncView startAction={vi.fn()} getStatusAction={getStatusAction} />);

    await waitFor(() => expect(getStatusAction).toHaveBeenCalledWith("sync-restored"));
    expect(screen.getByText("2 de 10 publicaciones")).toBeInTheDocument();
  });
});
