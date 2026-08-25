import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TiendanubeReplicationCell, TiendanubeRereplicationCell } from "./tiendanube-replication-cell.client";

const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));

const state = { sourceKey: "item:MLA1", status: "NOT_REPLICATED" as const, tiendanubeProductId: null };

describe("TiendanubeReplicationCell", () => {
  afterEach(() => {
    cleanup();
    refresh.mockClear();
  });

  it.each([
    ["NOT_REPLICATED", "Replicar a Tiendanube"],
    ["PENDING", "Procesando"],
    ["FAILED", "Reintentar"],
    ["COMPLETED", "Volver a replicar"],
  ] as const)("muestra %s correctamente", (status, text) => {
    render(<TiendanubeReplicationCell action={vi.fn()} initialState={{ ...state, status }} sourceId="uuid-1" />);
    expect(screen.getByText(text)).toBeInTheDocument();
  });

  it("deshabilita la acción mientras replica y refresca al confirmar", async () => {
    let resolve: ((value: { ok: true; action: "created" }) => void) | undefined;
    const action = vi.fn(() => new Promise<{ ok: true; action: "created" }>((done) => { resolve = done; }));
    render(<TiendanubeReplicationCell action={action} initialState={state} sourceId="uuid-1" />);
    const button = screen.getByRole("button", { name: "Replicar a Tiendanube" });
    fireEvent.click(button);
    expect(button).toBeDisabled();
    resolve?.({ ok: true, action: "created" });
    await vi.waitFor(() => expect(screen.getByText("✓ Publicado en Tiendanube")).toBeInTheDocument());
    await vi.waitFor(() => expect(screen.getByText("Se replicó correctamente en Tiendanube.")).toBeInTheDocument());
    expect(refresh).toHaveBeenCalled();
    expect(action).toHaveBeenCalledWith("uuid-1");
  });

  it("deja Volver a replicar deshabilitado mientras no existe una action real", async () => {
    render(<TiendanubeRereplicationCell action={vi.fn()} initialState={state} sourceId="uuid-1" />);
    const button = screen.getByRole("button", { name: "Volver a replicar" });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("title", "Próximamente: volver a sincronizar con Tiendanube");
  });
});
