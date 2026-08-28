import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PromotionCampaignsSkeleton } from "./promotion-campaigns-skeleton";

describe("PromotionCampaignsSkeleton", () => {
  it("renderiza placeholders para filtros y filas mientras campaigns está pendiente", () => {
    render(<PromotionCampaignsSkeleton />);
    expect(screen.getByLabelText("Cargando promociones")).toBeInTheDocument();
    expect(document.querySelectorAll(".ant-skeleton-input")).toHaveLength(1);
  });
});
