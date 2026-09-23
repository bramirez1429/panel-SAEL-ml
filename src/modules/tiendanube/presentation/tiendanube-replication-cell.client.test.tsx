import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TiendanubeReplicationCell } from "./tiendanube-replication-cell.client";

const state = { sourceKey: "item:MLA1", status: "NOT_REPLICATED" as const, tiendanubeProductId: null };
const categories = [
  { id: 10, name: "Remeras", parentId: null },
  { id: 20, name: "Buzos", parentId: null },
];

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

  it("muestra las categorías recibidas en el selector", () => {
    render(<TiendanubeReplicationCell action={vi.fn()} initialState={state} sourceKey={state.sourceKey} categories={categories} />);
    fireEvent.click(screen.getByRole("button", { name: "Replicar TN" }));
    fireEvent.mouseDown(screen.getByLabelText("Categoría"));
    expect(screen.getAllByText("Remeras").length).toBeGreaterThan(0);
    expect(screen.getByText("Buzos")).toBeInTheDocument();
  });

  it("confirma y muestra el estado replicado", async () => {
    const action = vi.fn().mockResolvedValue({ ok: true, action: "created" as const });
    render(<TiendanubeReplicationCell action={action} initialState={state} sourceKey={state.sourceKey} categories={categories} />);
    fireEvent.click(screen.getByRole("button", { name: "Replicar TN" }));
    fireEvent.click(screen.getByRole("button", { name: "Replicar" }));
    await vi.waitFor(() => expect(screen.getByText("✓ Replicado")).toBeInTheDocument());
    expect(action).toHaveBeenCalledWith("item:MLA1", { priceMode: "KEEP_SOURCE", tagMode: "KEEP_SOURCE", categoryId: 10 });
  });

  it("muestra el error de categorías y bloquea la replicación", () => {
    const action = vi.fn();
    render(<TiendanubeReplicationCell action={action} initialState={state} sourceKey={state.sourceKey} categories={[]} categoriesError="No se pudieron cargar las categorías de Tiendanube." />);
    fireEvent.click(screen.getByRole("button", { name: "Replicar TN" }));
    expect(screen.getByRole("alert")).toHaveTextContent("No se pudieron cargar las categorías de Tiendanube.");
    expect(screen.getByRole("button", { name: /^Replicar$/ })).toBeDisabled();
    expect(screen.getByLabelText("Categoría")).toBeDisabled();
  });

  it("distingue la ausencia real de categorías de un error", () => {
    render(<TiendanubeReplicationCell action={vi.fn()} initialState={state} sourceKey={state.sourceKey} categories={[]} categoriesError={null} />);
    fireEvent.click(screen.getByRole("button", { name: "Replicar TN" }));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Categoría")).not.toBeDisabled();
  });
});
