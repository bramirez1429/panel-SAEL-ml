import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TiendanubeReplicationCell } from "./tiendanube-replication-cell.client";

const state = { sourceKey: "item:MLA1", status: "NOT_REPLICATED" as const, tiendanubeProductId: null };
const categories = [{ id: 10, name: "Remeras", parentId: null }];

describe("TiendanubeReplicationCell", () => {
  afterEach(cleanup);
  it("abre el modal sin replicar antes de confirmar", () => {
    const action = vi.fn();
    render(<TiendanubeReplicationCell action={action} initialState={state} sourceKey={state.sourceKey} categories={categories} />);
    fireEvent.click(screen.getByRole("button", { name: "Replicar TN" }));
    expect(screen.getByRole("dialog", { name: "Replicar en Tiendanube" })).toBeInTheDocument();
    expect(action).not.toHaveBeenCalled();
    expect(screen.getByLabelText("Categoría")).toBeInTheDocument();
  });

  it("confirma y muestra el estado replicado", async () => {
    const action = vi.fn().mockResolvedValue({ ok: true, action: "created" as const });
    render(<TiendanubeReplicationCell action={action} initialState={state} sourceKey={state.sourceKey} categories={categories} />);
    fireEvent.click(screen.getByRole("button", { name: "Replicar TN" }));
    fireEvent.click(screen.getByRole("button", { name: "Replicar" }));
    await vi.waitFor(() => expect(screen.getByText("✓ Replicado")).toBeInTheDocument());
    expect(action).toHaveBeenCalledWith("item:MLA1", { priceMode: "KEEP_SOURCE", categoryId: 10 });
  });
});
