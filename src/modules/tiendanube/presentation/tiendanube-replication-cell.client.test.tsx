import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TiendanubeReplicationCell, TiendanubeRereplicationCell } from "./tiendanube-replication-cell.client";

const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));

const state = { sourceKey: "item:MLA1", status: "NOT_REPLICATED" as const, tiendanubeProductId: null };
const sourceKey = "item:MLA1";

describe("TiendanubeReplicationCell", () => {
  afterEach(() => {
    cleanup();
    refresh.mockClear();
  });

  it("muestra Replicar TN activo cuando no está replicada", () => {
    render(<TiendanubeReplicationCell action={vi.fn()} initialState={state} sourceKey={sourceKey} />);
    expect(screen.getByRole("button", { name: "Replicar TN" })).toBeEnabled();
  });

  it("muestra Procesando deshabilitado mientras el estado está pendiente", () => {
    render(<TiendanubeReplicationCell action={vi.fn()} initialState={{ ...state, status: "PENDING" }} sourceKey={sourceKey} />);
    expect(screen.getByRole("button", { name: "Procesando..." })).toBeDisabled();
  });

  it("muestra Reintentar activo cuando la replicación falló", () => {
    render(<TiendanubeReplicationCell action={vi.fn()} initialState={{ ...state, status: "FAILED" }} sourceKey={sourceKey} />);
    expect(screen.getByRole("button", { name: "Reintentar" })).toBeEnabled();
  });

  it("muestra Replicado y deja volver a replicar activo cuando está completada", () => {
    const { unmount } = render(<TiendanubeReplicationCell action={vi.fn()} initialState={{ ...state, status: "COMPLETED" }} sourceKey={sourceKey} />);
    expect(screen.getByText("✓ Replicado")).toBeInTheDocument();
    unmount();
    render(<TiendanubeRereplicationCell action={vi.fn()} initialState={{ ...state, status: "COMPLETED" }} sourceKey={sourceKey} />);
    expect(screen.getByRole("button", { name: "Volver a replicar" })).toBeEnabled();
  });

  it("deshabilita la acción sólo durante la request y refresca al confirmar", async () => {
    let resolve: ((value: { ok: true; action: "created" }) => void) | undefined;
    const action = vi.fn(() => new Promise<{ ok: true; action: "created" }>((done) => { resolve = done; }));
    render(<TiendanubeReplicationCell action={action} initialState={state} sourceKey={sourceKey} />);
    const button = screen.getByRole("button", { name: "Replicar TN" });
    fireEvent.click(button);
    expect(button).toBeDisabled();
    resolve?.({ ok: true, action: "created" });
    await vi.waitFor(() => expect(screen.getByText("✓ Replicado")).toBeInTheDocument());
    await vi.waitFor(() => expect(screen.getByText("Se replicó correctamente en Tiendanube.")).toBeInTheDocument());
    expect(refresh).toHaveBeenCalled();
    expect(action).toHaveBeenCalledWith(sourceKey);
  });

  it("mantiene el botón de volver deshabilitado si no está completada", () => {
    render(<TiendanubeRereplicationCell action={vi.fn()} initialState={state} sourceKey={sourceKey} />);
    const button = screen.getByRole("button", { name: "Volver a replicar" });
    expect(button).toBeDisabled();
  });
});
