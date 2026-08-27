import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import type { PromotionAnalysisPage, PromotionAnalysisPublication } from "../domain/promotion-analysis.model";
import { PromotionAnalysisTable } from "./promotion-analysis-table.client";

describe("PromotionAnalysisTable", () => {
  it("renderiza Legacy, Family, elegibles, aporte y rango de precios", () => {
    render(<PromotionAnalysisTable page={page([publication("LEGACY"), publication("FAMILY", { sourceKey: "family:2", eligibleItems: 3, totalItems: 5, minPromotionPrice: 34820, maxPromotionPrice: 39500 })])} />);
    expect(screen.getByText("Anterior")).toBeInTheDocument();
    expect(screen.getByText("Familia")).toBeInTheDocument();
    expect(screen.getByText("3/5")).toBeInTheDocument();
    expect(screen.getAllByText("$999")).toHaveLength(2);
    expect(screen.getByText("$34.820 - $39.500")).toBeInTheDocument();
    expect(screen.getByText("Aplicar a 3")).toBeInTheDocument();
  });

  it("muestra guiones para aporte y neto null y no muestra precio $0", () => {
    render(<PromotionAnalysisTable page={page([publication("FAMILY", { minPromotionPrice: 0, maxPromotionPrice: 0, minEstimatedNetAmount: null, maxEstimatedNetAmount: null, minMercadoLibreContributionAmount: null, maxMercadoLibreContributionAmount: null })])} />);
    expect(screen.getByText("Requiere definir precio")).toBeInTheDocument();
    expect(screen.queryByText("$0")).not.toBeInTheDocument();
    expect(screen.getAllByText("—")).toHaveLength(5);
  });

  it("selecciona publicaciones y suma sus variantes elegibles", async () => {
    const user = userEvent.setup();
    render(<PromotionAnalysisTable page={page([publication("LEGACY"), publication("FAMILY", { sourceKey: "family:2", eligibleItems: 3, totalItems: 5 })])} />);
    const checkboxes = screen.getAllByRole("checkbox");
    await user.click(checkboxes[1]!);
    await user.click(checkboxes[2]!);
    expect(screen.getByText("2 publicaciones seleccionadas · 4 variantes elegibles")).toBeInTheDocument();
  });
});

function page(publications: readonly PromotionAnalysisPublication[]): PromotionAnalysisPage {
  return { publications, done: true, nextCursor: null, count: publications.length };
}

type PublicationOverrides = Partial<PromotionAnalysisPublication["summary"]> & Pick<
  PromotionAnalysisPublication,
  "sourceKey" | "eligibleItems" | "totalItems"
>;

function publication(
  model: "LEGACY" | "FAMILY",
  overrides: Partial<PublicationOverrides> = {},
): PromotionAnalysisPublication {
  const { sourceKey = "item:1", eligibleItems = 1, totalItems = 1, ...summary } = overrides;
  return {
    sourceKey, title: model === "LEGACY" ? "Remera Legacy" : "Remera Family", thumbnail: null, model,
    totalItems, eligibleItems, ineligibleItems: totalItems - eligibleItems,
    summary: {
      totalItems, eligibleItems, ineligibleItems: totalItems - eligibleItems,
      minPromotionPrice: 34820, maxPromotionPrice: 34820,
      minEstimatedNetAmount: 21153, maxEstimatedNetAmount: 21153,
      minMercadoLibreContributionAmount: 999, maxMercadoLibreContributionAmount: 999,
      ...summary,
    },
    children: [],
  };
}
