import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { PublicationStockCell } from "./publication-stock-cell.client";
import type { PublicationVariantTableRow } from "./publication-variant-row";

const row: PublicationVariantTableRow = {
  key: "MLA1",
  imageUrl: null,
  publicationId: "MLA1",
  publicationType: "LEGACY",
  userProductId: null,
  sku: "SKU-1",
  itemId: "MLA1",
  familyId: null,
  variationId: null,
  status: "active",
  price: { amount: 100, currency: "ARS" },
  stock: 4,
  sold: 0,
  color: null,
  size: null,
  permalink: null,
};

describe("PublicationStockCell", () => {
  afterEach(cleanup);

  it("guarda con Enter y muestra loading y confirmación", async () => {
    let resolveAction!: (value: { ok: true; confirmed: { stock: number } }) => void;
    const updateAction = vi.fn(() => new Promise<{ ok: true; confirmed: { stock: number } }>((resolve) => { resolveAction = resolve; }));
    const user = userEvent.setup();
    render(<PublicationStockCell row={row} updateAction={updateAction} onError={vi.fn()} />);

    const input = screen.getByRole("spinbutton", { name: "Stock de SKU-1" });
    await user.clear(input);
    await user.type(input, "7{Enter}");
    expect(updateAction).toHaveBeenCalledTimes(1);
    expect(screen.getByLabelText("Guardando stock")).toBeInTheDocument();

    resolveAction({ ok: true, confirmed: { stock: 7 } });
    expect(await screen.findByLabelText("Stock guardado")).toBeInTheDocument();
  });

  it("guarda al salir de la celda con blur/Tab", async () => {
    const updateAction = vi.fn().mockResolvedValue({ ok: true, confirmed: { stock: 6 } });
    const user = userEvent.setup();
    render(<PublicationStockCell row={row} updateAction={updateAction} onError={vi.fn()} />);

    const input = screen.getByRole("spinbutton", { name: "Stock de SKU-1" });
    await user.clear(input);
    await user.type(input, "6");
    await user.tab();
    await waitFor(() => expect(updateAction).toHaveBeenCalledTimes(1));
  });

  it("restaura el stock anterior e informa el error", async () => {
    const onError = vi.fn();
    const updateAction = vi.fn().mockResolvedValue({ ok: false, message: "Mercado Libre rechazó el cambio" });
    const user = userEvent.setup();
    render(<PublicationStockCell row={row} updateAction={updateAction} onError={onError} />);

    const input = screen.getByRole("spinbutton", { name: "Stock de SKU-1" });
    await user.clear(input);
    await user.type(input, "9{Enter}");

    await waitFor(() => expect(input).toHaveValue("4"));
    expect(onError).toHaveBeenCalledWith("Mercado Libre rechazó el cambio");
  });

  it("no hace requests si el valor no cambió", async () => {
    const updateAction = vi.fn();
    const user = userEvent.setup();
    render(<PublicationStockCell row={row} updateAction={updateAction} onError={vi.fn()} />);

    const input = screen.getByRole("spinbutton", { name: "Stock de SKU-1" });
    await user.click(input);
    await user.keyboard("{Enter}");
    await user.tab();
    expect(updateAction).not.toHaveBeenCalled();
  });
});
