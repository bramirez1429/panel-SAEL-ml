import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { useState } from "react";

import type { BulkStockPreview } from "../domain/bulk-stock.model";
import { BulkStockPreviewView } from "./bulk-stock-preview.client";

afterEach(cleanup);

describe("BulkStockPreviewView", () => {
  it("selecciona solamente las modificables y permite excluir una variante", async () => {
    const user = userEvent.setup();
    render(<PreviewHarness initial={new Set()} />);

    const selectAll = screen.getByRole("checkbox", { name: "Seleccionar todos los modificables" });
    const first = screen.getByRole("checkbox", { name: "Seleccionar Brooklyn / Negro / 40" });
    const second = screen.getByRole("checkbox", { name: "Seleccionar Brooklyn / Crema / 42" });
    const unchanged = screen.getByRole("checkbox", { name: "Seleccionar Basic / 44" });

    expect(unchanged).toBeDisabled();
    await user.click(selectAll);
    expect(selectAll).toBeChecked();
    expect(first).toBeChecked();
    expect(second).toBeChecked();
    expect(unchanged).not.toBeChecked();
    expect(screen.getByRole("button", { name: "Aplicar cambios a 2 variantes" })).toBeEnabled();

    await user.click(first);
    expect(first).not.toBeChecked();
    expect(second).toBeChecked();
    expect(selectAll).not.toBeChecked();
    expect(selectAll).toHaveAttribute("aria-checked", "mixed");
    expect(screen.getByRole("button", { name: "Aplicar cambios a 1 variantes" })).toBeEnabled();
  });

  it("sale del estado indeterminate al quitar todas las seleccionadas", async () => {
    const user = userEvent.setup();
    render(<PreviewHarness initial={new Set(["black", "cream"])} />);

    await user.click(screen.getByRole("checkbox", { name: "Seleccionar Brooklyn / Negro / 40" }));
    const selectAll = screen.getByRole("checkbox", { name: "Seleccionar todos los modificables" });
    expect(selectAll).toHaveAttribute("aria-checked", "mixed");

    await user.click(screen.getByRole("checkbox", { name: "Seleccionar Brooklyn / Crema / 42" }));
    expect(selectAll).not.toBeChecked();
    expect(selectAll).not.toHaveAttribute("aria-checked", "mixed");
    expect(screen.getByRole("button", { name: "Aplicar cambios a 0 variantes" })).toBeDisabled();
  });
});

function PreviewHarness({ initial }: Readonly<{ initial: ReadonlySet<string> }>) {
  const [selected, setSelected] = useState(initial);
  return (
    <BulkStockPreviewView
      preview={preview}
      selectedKeys={selected}
      submitting={false}
      onBack={() => undefined}
      onSelectionChange={setSelected}
      onSubmit={() => undefined}
    />
  );
}

const preview: BulkStockPreview = {
  previewId: "preview-1",
  summary: {
    found: 3,
    editable: 2,
    active: 1,
    paused: 1,
    outOfStock: 2,
    unchanged: 1,
    userProduct: 2,
    legacy: 1,
  },
  variants: [
    {
      key: "black",
      itemId: "MLA1",
      familyId: "1",
      variationId: null,
      userProductId: "UP1",
      model: "USER_PRODUCT",
      title: "Brooklyn",
      color: "Negro",
      size: "40",
      publicationType: "USER_PRODUCT",
      currentStock: 0,
      newStock: 4,
      currentQuantity: 0,
      requestedQuantity: 4,
      currentStatus: "active",
      status: "active",
      editable: true,
      needsChange: true,
      reason: null,
      storeId: null,
      networkNodeId: null,
    },
    {
      key: "cream",
      itemId: "MLA2",
      familyId: null,
      variationId: "22",
      userProductId: null,
      model: "LEGACY",
      title: "Brooklyn",
      color: "Crema",
      size: "42",
      publicationType: "LEGACY",
      currentStock: 2,
      newStock: 4,
      currentQuantity: 2,
      requestedQuantity: 4,
      currentStatus: "paused",
      status: "paused",
      editable: true,
      needsChange: true,
      reason: null,
      storeId: null,
      networkNodeId: null,
    },
    {
      key: "basic",
      itemId: "MLA3",
      familyId: null,
      variationId: "33",
      userProductId: null,
      model: "LEGACY",
      title: "Basic",
      color: null,
      size: "44",
      publicationType: "LEGACY",
      currentStock: 0,
      newStock: 0,
      currentQuantity: 0,
      requestedQuantity: 0,
      currentStatus: "paused",
      status: "paused",
      editable: true,
      needsChange: false,
      reason: null,
      storeId: null,
      networkNodeId: null,
    },
  ],
};
