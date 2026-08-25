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
    ["NOT_REPLICATED", "Replicar"],
    ["PENDING", "Procesando"],
    ["FAILED", "Reintentar"],
    ["COMPLETED", "Replicado"],
  ] as const)("muestra %s correctamente", (status, text) => {
    render(<TiendanubeReplicationCell action={vi.fn()} initialState={{ ...state, status }} sourceKey={state.sourceKey} />);
    expect(screen.getByText(text)).toBeInTheDocument();
  });

  it("deshabilita la acción mientras replica y refresca al confirmar", async () => {
    let resolve: ((value: { ok: true }) => void) | undefined;
    const action = vi.fn(() => new Promise<{ ok: true }>((done) => { resolve = done; }));
    render(<TiendanubeReplicationCell action={action} initialState={state} sourceKey={state.sourceKey} />);
    const button = screen.getByRole("button", { name: "Replicar" });
    fireEvent.click(button);
    expect(button).toBeDisabled();
    resolve?.({ ok: true });
    await vi.waitFor(() => expect(screen.getByText("Replicado")).toBeInTheDocument());
    await vi.waitFor(() => expect(screen.getByText("Se replicó correctamente en Tiendanube.")).toBeInTheDocument());
    expect(refresh).toHaveBeenCalled();
  });

  it("deja Volver a replicar deshabilitado mientras no existe una action real", async () => {
    render(<TiendanubeRereplicationCell />);
    const button = screen.getByRole("button", { name: "Volver a replicar" });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("title", "Próximamente: volver a sincronizar con Tiendanube");
  });
});
