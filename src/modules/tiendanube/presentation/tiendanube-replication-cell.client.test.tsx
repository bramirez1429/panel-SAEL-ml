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

  it.each(["NOT_REPLICATED", "PENDING", "FAILED", "COMPLETED"] as const)("muestra el botón para %s", (status) => {
    render(<TiendanubeReplicationCell action={vi.fn()} initialState={{ ...state, status }} sourceId="123e4567-e89b-42d3-a456-426614174000" />);
    expect(screen.getByRole("button", { name: "Replicar TN" })).toBeInTheDocument();
  });

  it("deshabilita la acción mientras replica y refresca al confirmar", async () => {
    let resolve: ((value: { ok: true; action: "created" }) => void) | undefined;
    const action = vi.fn(() => new Promise<{ ok: true; action: "created" }>((done) => { resolve = done; }));
    render(<TiendanubeReplicationCell action={action} initialState={state} sourceId="123e4567-e89b-42d3-a456-426614174000" />);
    const button = screen.getByRole("button", { name: "Replicar TN" });
    fireEvent.click(button);
    expect(button).toBeDisabled();
    resolve?.({ ok: true, action: "created" });
    await vi.waitFor(() => expect(screen.getByText("Se replicó correctamente en Tiendanube.")).toBeInTheDocument());
    expect(refresh).toHaveBeenCalled();
    expect(action).toHaveBeenCalledWith("123e4567-e89b-42d3-a456-426614174000");
  });

  it("deja Volver a replicar deshabilitado mientras no existe una action real", async () => {
    render(<TiendanubeRereplicationCell action={vi.fn()} initialState={state} sourceId={null} />);
    const button = screen.getByRole("button", { name: "Volver a replicar" });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("title", "Próximamente: volver a sincronizar con Tiendanube");
  });
});
