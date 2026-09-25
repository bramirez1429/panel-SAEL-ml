import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { IntegrationEventBanner } from "./integration-event-banner";

describe("IntegrationEventBanner", () => {
  it("muestra un aviso prudente para POSSIBLE_API_CHANGE", () => {
    render(<IntegrationEventBanner events={[{ type: "POSSIBLE_API_CHANGE", count: 2 }]} />);
    expect(screen.getByText("Posible cambio detectado en Mercado Libre")).toBeInTheDocument();
    expect(screen.getByText("Se detectó una respuesta de Mercado Libre diferente a la esperada.")).toBeInTheDocument();
  });
});
