import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PromotionCampaignsError } from "./promotion-campaigns-error";

describe("PromotionCampaignsError", () => {
  it("muestra el error de carga sin confundirlo con un catálogo vacío", () => {
    render(<PromotionCampaignsError />);
    expect(screen.getByText("No pudimos cargar las promociones de Mercado Libre. Intentá nuevamente.")).toBeInTheDocument();
    expect(screen.queryByText("No hay promociones disponibles actualmente.")).not.toBeInTheDocument();
  });
});
