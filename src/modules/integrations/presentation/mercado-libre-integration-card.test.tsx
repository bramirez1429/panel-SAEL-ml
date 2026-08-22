import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { MercadoLibreIntegrationCard } from "./mercado-libre-integration-card";

describe("MercadoLibreIntegrationCard", () => {
  it("mantiene inactivo el flujo cuando no hay conexión asociada al usuario", () => {
    render(<MercadoLibreIntegrationCard status="not-connected" />);

    expect(screen.getByText("No conectado")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Conectar Mercado Libre" }),
    ).toHaveAttribute("href", "/api/integrations/mercado-libre/connect");
  });

  it("muestra la confirmación prevista para una conexión verificada", () => {
    render(<MercadoLibreIntegrationCard status="connected" />);

    expect(screen.getByText("Conectado a Mercado Libre")).toBeInTheDocument();
    expect(screen.getByText("Bienvenido al panel")).toBeInTheDocument();
  });
});
