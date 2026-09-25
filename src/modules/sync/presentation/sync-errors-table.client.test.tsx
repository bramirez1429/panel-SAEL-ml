import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { SyncError } from "../domain/sync.model";
import { SyncErrorsTable } from "./sync-errors-table.client";

const syncId = "11111111-1111-4111-8111-111111111111";
const errors = [syncError("aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", "MLA1"), syncError("bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb", "MLA2")];

describe("SyncErrorsTable", () => {
  afterEach(cleanup);

  it("reintenta los errores seleccionados", async () => {
    const retrySelectedAction = vi.fn().mockResolvedValue({ ok: true, data: retryResult() });
    renderTable({ retrySelectedAction });
    const checkboxes = screen.getAllByRole("checkbox");
    fireEvent.click(checkboxes[1]!);
    fireEvent.click(checkboxes[2]!);
    fireEvent.click(screen.getByRole("button", { name: "Reintentar seleccionados" }));
    await waitFor(() => expect(retrySelectedAction).toHaveBeenCalledWith(syncId, [errors[0]!.id, errors[1]!.id]));
  });

  it("reintenta todos los errores", async () => {
    const retryAllAction = vi.fn().mockResolvedValue({ ok: true, data: retryResult() });
    renderTable({ retryAllAction });
    fireEvent.click(screen.getByRole("button", { name: "Reintentar todos" }));
    await waitFor(() => expect(retryAllAction).toHaveBeenCalledWith(syncId));
  });
});

function renderTable(overrides: Partial<React.ComponentProps<typeof SyncErrorsTable>>) {
  const result = retryResult();
  return render(
    <SyncErrorsTable
      initialErrors={errors}
      loadErrorsAction={vi.fn().mockResolvedValue({ ok: true, data: [] })}
      retryAllAction={vi.fn().mockResolvedValue({ ok: true, data: result })}
      retryOneAction={vi.fn().mockResolvedValue({ ok: true, data: result })}
      retrySelectedAction={vi.fn().mockResolvedValue({ ok: true, data: result })}
      syncId={syncId}
      {...overrides}
    />,
  );
}

function syncError(id: string, itemId: string): SyncError {
  return {
    id,
    syncId,
    itemId,
    familyId: null,
    type: "PUBLICATION_ERROR",
    code: null,
    message: "No se pudo sincronizar",
    attempts: 1,
    status: "OPEN",
    createdAt: "2026-09-25T10:00:00.000Z",
    updatedAt: "2026-09-25T10:00:00.000Z",
  };
}

function retryResult() {
  return { syncId, retriedItems: 2, resolvedItems: 2, openErrorsCount: 0 };
}
