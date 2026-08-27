import { describe, expect, it } from "vitest";

import { mapPromotionAnalysis } from "./promotion-analysis.mapper";
import type { PromotionAnalysisResponseDto } from "../infrastructure/promotion-analysis.schema";

describe("mapPromotionAnalysis", () => {
  it("genera una publicación Legacy con su único MLA", () => {
    const result = page([analysisPublication("item:MLA1", "LEGACY", [child("MLA1")])]).publications[0];
    expect(result).toMatchObject({ sourceKey: "item:MLA1", model: "LEGACY", totalItems: 1, eligibleItems: 1 });
    expect(result?.children).toHaveLength(1);
  });

  it("agrupa los MLA reales de una Family y calcula 3/5 elegibles", () => {
    const children = [child("MLA1"), child("MLA2"), child("MLA3"), child("MLA4", false), child("MLA5", false)];
    const result = page([analysisPublication("family:100", "FAMILY", children)]).publications[0];
    expect(result).toMatchObject({ sourceKey: "family:100", totalItems: 5, eligibleItems: 3, ineligibleItems: 2 });
    expect(result?.children.map((item) => item.variantLabel)).toEqual(["Negro · S", "Negro · S", "Negro · S", "Negro · S", "Negro · S"]);
  });

  it("normaliza el aporte informado y suma el boost de Mercado Libre", () => {
    const result = page([analysisPublication("item:MLA1", "LEGACY", [child("MLA1", true, { mercadoLibreBaseContributionAmount: 100, mercadoLibreBoostAmount: 25 })])]);
    expect(result.publications[0]?.children[0]).toMatchObject({
      mercadoLibreBaseContributionAmount: 100,
      mercadoLibreBoostAmount: 25,
      mercadoLibreContributionAmount: 125,
    });
  });

  it("mantiene null si Mercado Libre no informó ningún aporte", () => {
    const result = page([analysisPublication("item:MLA1", "LEGACY", [child("MLA1")])]);
    expect(result.publications[0]?.children[0]?.mercadoLibreContributionAmount).toBeNull();
  });

  it("no interpreta price=0 como una promoción a $0", () => {
    const result = page([analysisPublication("item:MLA1", "LEGACY", [child("MLA1", true, { price: 0 })])]);
    expect(result.publications[0]?.children[0]).toMatchObject({ promotionPrice: null, discountPercent: null, requiresPriceSelection: true });
  });

  it("conserva el neto estimado informado por el cálculo de selling fee", () => {
    const result = page([analysisPublication("item:MLA1", "LEGACY", [child("MLA1")])]);
    expect(result.publications[0]?.children[0]?.saleEstimate).toEqual({ saleFeeAmount: 120, estimatedNetAmount: 680 });
  });

});

function page(publications: PromotionAnalysisResponseDto["publications"]) {
  return mapPromotionAnalysis({ done: true, nextCursor: null, publications });
}

function analysisPublication(
  sourceKey: string,
  model: "LEGACY" | "FAMILY",
  children: PromotionAnalysisResponseDto["publications"][number]["children"],
): PromotionAnalysisResponseDto["publications"][number] {
  return { sourceKey, model, title: "Remera", thumbnail: null, children };
}

function child(
  itemId: string,
  eligible = true,
  candidateOverrides: Partial<NonNullable<PromotionAnalysisResponseDto["publications"][number]["children"][number]["candidate"]>> = {},
): PromotionAnalysisResponseDto["publications"][number]["children"][number] {
  return {
    itemId,
    eligible,
    originalPrice: 1000,
    variantLabel: null,
    attributes: [{ valueName: "Negro" }, { valueName: "S" }],
    requiresPriceSelection: false,
    candidate: {
      price: 800,
      originalPrice: 1000,
      discountPercent: 20,
      startDate: "2026-08-01T00:00:00Z",
      finishDate: "2026-08-31T23:59:59Z",
      mercadoLibreContributionAmount: null,
      mercadoLibreBaseContributionAmount: null,
      mercadoLibreBoostAmount: null,
      ...candidateOverrides,
    },
    saleEstimate: { saleFeeAmount: 120, estimatedNetAmount: 680 },
  };
}
