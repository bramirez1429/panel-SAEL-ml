import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { MercadolibreSyncView, syncPercent } from "./mercadolibre-sync-view.client";

const SYNC_ID = "11111111-1111-4111-8111-111111111111";

const pending = {
  ok: true as const,
  syncId: SYNC_ID,
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
    expect(getStatusAction).toHaveBeenCalledWith(SYNC_ID);
  });

  it("muestra COMPLETED al 100% y permite sincronizar nuevamente", async () => {
    const completed = { ...pending, status: "COMPLETED" as const, processedItems: 10 };
    render(<MercadolibreSyncView startAction={vi.fn().mockResolvedValue(completed)} getStatusAction={vi.fn()} />);

    await act(async () => { await screen.getByRole("button", { name: "Sincronizar ahora" }).click(); });

    expect(screen.getByText("Sincronización completada")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sincronizar ahora" })).toBeEnabled();
  });

  it("muestra el estado FAILED sin exponer el error técnico", async () => {
    const failed = { ...pending, status: "FAILED" as const, lastError: "token secreto" };
    render(<MercadolibreSyncView startAction={vi.fn().mockResolvedValue(failed)} getStatusAction={vi.fn()} />);

    await act(async () => { await screen.getByRole("button", { name: "Sincronizar ahora" }).click(); });

    expect(screen.getByText("La sincronización no pudo completarse. Intentá nuevamente.")).toBeInTheDocument();
    expect(screen.queryByText("token secreto")).not.toBeInTheDocument();
  });

  it("restaura el syncId guardado y retoma el progreso", async () => {
    window.localStorage.setItem("mercadolibre-publication-sync-id", SYNC_ID);
    const getStatusAction = vi.fn().mockResolvedValue(pending);
    render(<MercadolibreSyncView startAction={vi.fn()} getStatusAction={getStatusAction} />);

    await waitFor(() => expect(getStatusAction).toHaveBeenCalledWith(SYNC_ID));
    expect(screen.getByText("2 de 10 publicaciones")).toBeInTheDocument();
  });

  it("recupera el job activo cuando no hay syncId local", async () => {
    const getActiveAction = vi.fn().mockResolvedValue(pending);
    render(<MercadolibreSyncView startAction={vi.fn()} getStatusAction={vi.fn()} getActiveAction={getActiveAction} />);

    await waitFor(() => expect(getActiveAction).toHaveBeenCalledTimes(1));
    expect(screen.getByText("2 de 10 publicaciones")).toBeInTheDocument();
    expect(window.localStorage.getItem("mercadolibre-publication-sync-id")).toBe(SYNC_ID);
  });

  it("descarta un syncId local inválido y recupera el trabajo activo sin consultar su estado", async () => {
    window.localStorage.setItem("mercadolibre-publication-sync-id", "sync-inválido");
    const getActiveAction = vi.fn().mockResolvedValue(null);
    const getStatusAction = vi.fn();
    render(<MercadolibreSyncView startAction={vi.fn()} getStatusAction={getStatusAction} getActiveAction={getActiveAction} />);

    await waitFor(() => expect(getActiveAction).toHaveBeenCalledTimes(1));
    expect(getStatusAction).not.toHaveBeenCalled();
    expect(window.localStorage.getItem("mercadolibre-publication-sync-id")).toBeNull();
  });

  it("conserva el mensaje real si falla el inicio", async () => {
    const startAction = vi.fn().mockResolvedValue({ ok: false as const, message: "La cola no está disponible" });
    render(<MercadolibreSyncView startAction={startAction} getStatusAction={vi.fn()} />);

    await act(async () => { await screen.getByRole("button", { name: "Sincronizar ahora" }).click(); });

    expect(screen.getByText("La cola no está disponible")).toBeInTheDocument();
  });

  it("cancela un job activo y detiene el estado de sincronización", async () => {
    const cancelAction = vi.fn().mockResolvedValue({ ...pending, status: "CANCELLED" as const });
    render(<MercadolibreSyncView startAction={vi.fn().mockResolvedValue(pending)} getStatusAction={vi.fn()} cancelAction={cancelAction} />);

    await act(async () => { await screen.getByRole("button", { name: "Sincronizar ahora" }).click(); });
    await act(async () => { await screen.getByRole("button", { name: "Cancelar sincronización" }).click(); });

    await act(async () => { await screen.getByRole("button", { name: "Sí, cancelar" }).click(); });

    expect(cancelAction).toHaveBeenCalledWith(SYNC_ID);
    expect(screen.getByText("Sincronización cancelada.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Cancelar sincronización" })).not.toBeInTheDocument();
  });
});
