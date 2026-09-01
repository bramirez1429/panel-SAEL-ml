import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/modules/promotions/presentation/promotions-catalog.server", () => ({
  PromotionsCatalog: () => <div data-testid="promotions-catalog">Buscador y promociones</div>,
}));

import PromotionsPage from "./page";

describe("PromotionsPage", () => {
  it("empieza con el catálogo sin renderizar el encabezado descriptivo", () => {
    render(<PromotionsPage searchParams={Promise.resolve({})} />);

    expect(screen.getByTestId("promotions-catalog")).toBeInTheDocument();
    expect(screen.queryByText("Promociones de tus publicaciones de Mercado Libre.")).not.toBeInTheDocument();
  });
});
