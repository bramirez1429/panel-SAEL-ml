import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { BulkStockJob } from "../domain/bulk-stock.model";
import { BulkStockProgress, progressColor, progressPercent } from "./bulk-stock-progress.client";
import { BulkStockFinalSummary } from "./bulk-stock-summary.client";

afterEach(cleanup);

describe("bulk stock progress", () => {
  it("muestra progreso, contadores y detalle por variante", () => {
    const job = createJob({ status: "PROCESSING", processed: 2, total: 5, succeeded: 1, errors: 0, skipped: 1, pending: 3 });
    render(<BulkStockProgress job={job} pollingError={null} />);

    expect(progressPercent(job)).toBe(40);
    expect(progressColor(10)).toBe("#1677ff");
    expect(progressColor(40)).toBe("#faad14");
    expect(progressColor(90)).toBe("#52c41a");
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "40");
    expect(screen.getByText("2 / 5 procesadas")).toBeInTheDocument();
    expect(screen.getByText("Negro / 40")).toBeInTheDocument();
    expect(screen.getByText("0 → 4")).toBeInTheDocument();
    expect(screen.getByText("Actualizado")).toBeInTheDocument();
  });

  it("muestra el resumen final y permite reintentar errores", async () => {
    const user = userEvent.setup();
    const retry = vi.fn();
    const finish = vi.fn();
    const job = createJob({
      status: "COMPLETED",
      processed: 57,
      total: 57,
      succeeded: 50,
      skipped: 5,
      errors: 2,
      pending: 0,
    });
    render(<BulkStockFinalSummary job={job} retrying={false} onFinish={finish} onRetryErrors={retry} />);

    expect(screen.getByText("Proceso finalizado")).toBeInTheDocument();
    expect(screen.getByText("50 actualizadas")).toBeInTheDocument();
    expect(screen.getByText("5 sin cambios")).toBeInTheDocument();
    expect(screen.getByText("2 errores")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Reintentar errores" }));
    await user.click(screen.getByRole("button", { name: "Finalizar" }));
    expect(retry).toHaveBeenCalledOnce();
    expect(finish).toHaveBeenCalledOnce();
  });
});

function createJob(overrides: Partial<BulkStockJob>): BulkStockJob {
  return {
    jobId: "job-1",
    status: "PROCESSING",
    processed: 1,
    total: 1,
    succeeded: 1,
    errors: 0,
    skipped: 0,
    pending: 0,
    items: [{
      key: "black",
      title: "Negro",
      color: null,
      size: "40",
      previousStock: 0,
      newStock: 4,
      status: "SUCCESS",
      message: null,
      itemId: "MLA1",
      variationId: null,
      userProductId: "UP1",
    }],
    ...overrides,
  };
}
