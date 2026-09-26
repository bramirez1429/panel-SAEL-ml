import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { SyncActionResult, SyncJob, SyncOverview } from "../domain/sync.model";
import { SyncStatusCard } from "./sync-status-card.client";

describe("SyncStatusCard", () => {
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("deshabilita Sincronizar ahora mientras RUNNING", () => {
    const running = job({ status: "RUNNING" });
    renderCard(overview(running));
    expect(screen.getByRole("button", { name: /Sincronizar ahora/i })).toBeDisabled();
  });

  it("inicia polling y lo detiene al completar", async () => {
    vi.useFakeTimers();
    const running = job({ status: "RUNNING" });
    const completed = job({
      status: "COMPLETED",
      processedItems: 250,
      successfulItems: 250,
      finishedAt: "2026-09-25T11:00:00.000Z",
    });
    const getStatus = vi.fn().mockResolvedValue({ ok: true, data: completed });
    const getOverviewAction = vi.fn().mockResolvedValue({ ok: true, data: overview(completed) });

    renderCard(overview(running), { getStatus, getOverviewAction, pollingIntervalMs: 20 });
    await act(async () => { await vi.advanceTimersByTimeAsync(20); });
    expect(getStatus).toHaveBeenCalledOnce();
    expect(screen.getByText(/25\/09\/2026/)).toBeInTheDocument();
    await act(async () => { await vi.advanceTimersByTimeAsync(100); });
    expect(getStatus).toHaveBeenCalledOnce();
  });

  it("no solapa requests cuando la consulta anterior sigue pendiente", async () => {
    vi.useFakeTimers();
    const running = job({ status: "RUNNING" });
    const getStatus = vi.fn(() => new Promise<SyncActionResult<SyncJob>>(() => undefined));

    renderCard(overview(running), { getStatus, pollingIntervalMs: 20 });
    await act(async () => { await vi.advanceTimersByTimeAsync(100); });

    expect(getStatus).toHaveBeenCalledOnce();
  });

  it("muestra revisar cuando termina con errores", () => {
    const completed = job({
      status: "COMPLETED_WITH_ERRORS",
      processedItems: 250,
      successfulItems: 230,
      failedItems: 20,
    });
    renderCard({ ...overview(completed), openErrorsCount: 20 });
    expect(screen.getAllByText("20 publicaciones necesitan revisión")).toHaveLength(2);
    expect(screen.getByRole("link", { name: "Revisar" })).toHaveAttribute("href", expect.stringContaining("/sincronizacion"));
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "100");
  });

  it("evita doble inicio mientras el request está pendiente", () => {
    let resolveStart: ((value: unknown) => void) | undefined;
    const startAction = vi.fn(() => new Promise((resolve) => { resolveStart = resolve; }));
    renderCard(overview(null), { startAction: startAction as never });
    const button = screen.getByRole("button", { name: /Sincronizar ahora/i });
    fireEvent.click(button);
    fireEvent.click(button);
    expect(startAction).toHaveBeenCalledOnce();
    resolveStart?.({ ok: false, message: "cancelado" });
  });

  it("confirma la cancelación, detiene el polling y vuelve a habilitar sincronizar", async () => {
    const running = job({ status: "RUNNING" });
    const cancelled = job({ status: "CANCELLED" });
    const cancelAction = vi.fn().mockResolvedValue({
      ok: true,
      data: { syncId: running.id, status: "CANCELLED", hasMore: false },
    });
    const getOverviewAction = vi.fn().mockResolvedValue({
      ok: true,
      data: overview(cancelled),
    });
    const getStatus = vi.fn().mockResolvedValue({ ok: true, data: running });

    renderCard(overview(running), {
      cancelAction,
      getOverviewAction,
      getStatus,
    });
    fireEvent.click(screen.getByRole("button", { name: "Cancelar sincronización" }));
    expect(cancelAction).not.toHaveBeenCalled();
    fireEvent.click(await screen.findByRole("button", { name: "Sí, cancelar" }));

    await waitFor(() => expect(cancelAction).toHaveBeenCalledWith(running.id));
    expect(await screen.findByText("Cancelada")).toBeInTheDocument();
    expect(screen.getByText("145 / 250")).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Sincronizar ahora/i })).toBeEnabled();
    });
    expect(screen.queryByRole("button", { name: "Cancelar sincronización" })).not.toBeInTheDocument();
    expect(getStatus).not.toHaveBeenCalled();
  });

  it("muestra la fecha de la última COMPLETED aunque la más reciente sea CANCELLED", () => {
    const cancelled = job({ status: "CANCELLED", finishedAt: "2026-09-25T11:00:00.000Z" });
    renderCard({
      ...overview(cancelled),
      lastSuccessfulSyncAt: "2026-09-21T12:00:00.000Z",
    });

    expect(screen.getByText("Cancelada")).toBeInTheDocument();
    expect(screen.getByText(/21\/09\/2026/)).toBeInTheDocument();
  });
});

function renderCard(
  initialOverview: SyncOverview,
  overrides: Partial<React.ComponentProps<typeof SyncStatusCard>> = {},
) {
  return render(
    <SyncStatusCard
      cancelAction={vi.fn().mockResolvedValue({ ok: true, data: { syncId: crypto.randomUUID(), status: "CANCELLED", hasMore: false } })}
      getOverviewAction={vi.fn().mockResolvedValue({ ok: true, data: initialOverview })}
      getStatus={vi.fn().mockResolvedValue({ ok: true, data: initialOverview.activeSync })}
      initialOverview={initialOverview}
      pollingIntervalMs={60_000}
      startAction={vi.fn().mockResolvedValue({ ok: true, data: { syncId: crypto.randomUUID(), status: "PENDING", created: true } })}
      {...overrides}
    />,
  );
}

function overview(current: SyncJob | null): SyncOverview {
  return {
    activeSync: current?.status === "RUNNING" || current?.status === "PENDING" ? current : null,
    latestSync: current?.status === "RUNNING" || current?.status === "PENDING" ? null : current,
    lastSuccessfulSyncAt: current?.status === "COMPLETED" ? current.finishedAt : null,
    nextAutomaticSyncAt: "2026-09-29T10:00:00.000Z",
    openErrorsCount: current?.failedItems ?? 0,
    integrationEvents: [],
  };
}

function job(overrides: Partial<SyncJob>): SyncJob {
  return {
    id: "11111111-1111-4111-8111-111111111111",
    status: "RUNNING",
    totalItems: 250,
    processedItems: 145,
    successfulItems: 141,
    failedItems: 4,
    startedAt: "2026-09-25T10:00:00.000Z",
    finishedAt: null,
    lastError: null,
    ...overrides,
  };
}
