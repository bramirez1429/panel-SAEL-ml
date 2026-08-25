import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TiendanubeReplicationCell, TiendanubeRereplicationCell } from "./tiendanube-replication-cell.client";

const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));

const state = { sourceKey: "item:MLA1", status: "NOT_REPLICATED" as const, tiendanubeProductId: null };
const sourceKey = "item:MLA1";

describe("TiendanubeReplicationCell", () => {
  afterEach(() => { cleanup(); refresh.mockClear(); });

  it("muestra Replicar TN activo sin UUID interno", () => {
    render(<TiendanubeReplicationCell action={vi.fn()} initialState={state} sourceKey={sourceKey} />);
    expect(screen.getByRole("button", { name: "Replicar TN" })).toBeEnabled();
  });

  it("muestra Procesando sin un botón deshabilitado", () => {
    render(<TiendanubeReplicationCell action={vi.fn()} initialState={{ ...state, status: "PENDING" }} sourceKey={sourceKey} />);
    expect(screen.getByText("Procesando...")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("muestra Reintentar activo cuando falla", () => {
    render(<TiendanubeReplicationCell action={vi.fn()} initialState={{ ...state, status: "FAILED" }} sourceKey={sourceKey} />);
    expect(screen.getByRole("button", { name: "Reintentar" })).toBeEnabled();
  });

  it("muestra Replicado y Volver a replicar activo cuando completa", () => {
    render(<TiendanubeReplicationCell action={vi.fn()} initialState={{ ...state, status: "COMPLETED" }} sourceKey={sourceKey} />);
    expect(screen.getByText("✓ Replicado")).toBeInTheDocument();
    cleanup();
    render(<TiendanubeRereplicationCell action={vi.fn()} initialState={{ ...state, status: "COMPLETED" }} sourceKey={sourceKey} />);
    expect(screen.getByRole("button", { name: "Volver a replicar" })).toBeEnabled();
  });

  it("protege doble click, confirma, notifica y refresca", async () => {
    let resolve: ((value: { ok: true; action: "created" }) => void) | undefined;
    const action = vi.fn(() => new Promise<{ ok: true; action: "created" }>((done) => { resolve = done; }));
    render(<TiendanubeReplicationCell action={action} initialState={state} sourceKey={sourceKey} />);
    const button = screen.getByRole("button", { name: "Replicar TN" });
    fireEvent.click(button); fireEvent.click(button);
    expect(action).toHaveBeenCalledTimes(1);
    resolve?.({ ok: true, action: "created" });
    await vi.waitFor(() => expect(screen.getByText("✓ Replicado")).toBeInTheDocument());
    expect(screen.getByText("Se replicó correctamente en Tiendanube.")).toBeInTheDocument();
    expect(refresh).toHaveBeenCalled();
  });

  it("muestra em dash cuando no está completada", () => {
    render(<TiendanubeRereplicationCell action={vi.fn()} initialState={state} sourceKey={sourceKey} />);
    expect(screen.getByText("—")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
