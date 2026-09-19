import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

import { IntegrationCard } from "./integration-card.client";

const disconnectAction = vi.fn().mockResolvedValue({ ok: true as const });

describe("IntegrationCard", () => {
  it("muestra la reconexión de Mercado Libre sin desconectar primero", () => {
    render(
      <IntegrationCard
        name="Mercado Libre"
        description="Canal de venta"
        icon="ML"
        status="reconnect-required"
        detail="Seller ID: 639189394"
        connectHref="/api/integrations/mercado-libre/connect"
        disconnectAction={disconnectAction}
      />,
    );

    expect(screen.getByText("Requiere reconexión")).toBeInTheDocument();
    expect(screen.getByText("Seller ID: 639189394")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Reconectar Mercado Libre" }),
    ).toHaveAttribute("href", "/api/integrations/mercado-libre/connect");
    expect(
      screen.getByRole("button", { name: "Desconectar" }),
    ).toBeInTheDocument();
    expect(disconnectAction).not.toHaveBeenCalled();
  });

  it.each([
    ["connected", "Conectado"],
    ["not-connected", "No conectado"],
    ["unknown", "No se pudo verificar el estado"],
  ] as const)("renderiza el estado %s", (status, label) => {
    render(
      <IntegrationCard
        name="Mercado Libre"
        description="Canal de venta"
        icon="ML"
        status={status}
        connectHref="/api/integrations/mercado-libre/connect"
        disconnectAction={disconnectAction}
      />,
    );

    expect(screen.getByText(label)).toBeInTheDocument();
  });

  it("mantiene sin cambios la acción de conexión de Tiendanube", () => {
    render(
      <IntegrationCard
        name="Tiendanube"
        description="Canal de venta"
        icon="TN"
        status="not-connected"
        connectHref="/api/integrations/tiendanube/connect"
        disconnectAction={disconnectAction}
      />,
    );

    expect(
      screen.getByRole("link", { name: "Conectar Tiendanube" }),
    ).toHaveAttribute("href", "/api/integrations/tiendanube/connect");
  });
});
