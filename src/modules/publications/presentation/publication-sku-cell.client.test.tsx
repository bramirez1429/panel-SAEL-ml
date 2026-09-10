import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { PublicationSkuCell } from "./publication-sku-cell.client";
import type { PublicationVariantTableRow } from "./publication-variant-row";

const row: PublicationVariantTableRow = { key: "UP-1", imageUrl: null, publicationId: "MLA1", publicationType: "USER_PRODUCT", userProductId: "UP-1", sku: "SKU-OLD", itemId: "MLA1", familyId: "FAMILY-1", variationId: null, status: "active", price: { amount: 100, currency: "ARS" }, stock: 4, sold: 1, color: "Negro", size: "M", permalink: null };

describe("PublicationSkuCell", () => {
  afterEach(cleanup);

  it("edita y guarda el SKU con Enter mostrando confirmación", async () => {
    const action = vi.fn().mockResolvedValue({ ok: true, confirmed: { sku: "SKU-NEW" } });
    const user = userEvent.setup();
    render(<PublicationSkuCell row={row} updateAction={action} onError={vi.fn()} />);
    await user.click(screen.getByRole("button", { name: "SKU-OLD" }));
    const input = screen.getByRole("textbox", { name: "SKU de M" });
    await user.clear(input);
    await user.type(input, "SKU-NEW{Enter}");
    expect(await screen.findByLabelText("SKU guardado")).toBeInTheDocument();
    expect(action).toHaveBeenCalledWith(expect.objectContaining({ target: { type: "family", familyId: "FAMILY-1", itemId: "MLA1" }, draft: expect.objectContaining({ sku: "SKU-NEW" }) }));
  });

  it("guarda al salir con Tab/blur", async () => {
    const action = vi.fn().mockResolvedValue({ ok: true, confirmed: { sku: "SKU-TAB" } });
    const user = userEvent.setup();
    render(<PublicationSkuCell row={row} updateAction={action} onError={vi.fn()} />);
    await user.click(screen.getByRole("button", { name: "SKU-OLD" }));
    const input = screen.getByRole("textbox", { name: "SKU de M" });
    await user.clear(input);
    await user.type(input, "SKU-TAB");
    await user.tab();
    await waitFor(() => expect(action).toHaveBeenCalledTimes(1));
  });

  it("restaura el SKU anterior cuando falla", async () => {
    const onError = vi.fn();
    const action = vi.fn().mockResolvedValue({ ok: false, message: "SKU rechazado" });
    const user = userEvent.setup();
    render(<PublicationSkuCell row={row} updateAction={action} onError={onError} />);
    await user.click(screen.getByRole("button", { name: "SKU-OLD" }));
    const input = screen.getByRole("textbox", { name: "SKU de M" });
    await user.clear(input);
    await user.type(input, "INVALIDO{Enter}");
    expect(await screen.findByRole("button", { name: "SKU-OLD" })).toBeInTheDocument();
    expect(onError).toHaveBeenCalledWith("SKU rechazado");
  });
});
