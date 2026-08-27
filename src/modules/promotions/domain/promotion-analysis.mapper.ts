import type {
  PromotionAnalysisChild,
  PromotionAnalysisPage,
  PromotionAnalysisPublication,
} from "./promotion-analysis.model";
import type { PromotionAnalysisResponseDto } from "../infrastructure/promotion-analysis.schema";

type RawChild = PromotionAnalysisResponseDto["publications"][number]["children"][number];

export function mapPromotionAnalysis(
  dto: PromotionAnalysisResponseDto,
): PromotionAnalysisPage {
  const publications = dto.publications.map(mapPublication);
  return { publications, done: dto.done, nextCursor: dto.nextCursor, count: publications.length };
}

function mapPublication(
  publication: PromotionAnalysisResponseDto["publications"][number],
): PromotionAnalysisPublication {
  const children = publication.children.map(mapChild);
  const eligibleItems = children.filter((child) => child.eligible).length;
  return {
    sourceKey: publication.sourceKey,
    title: publication.title,
    thumbnail: publication.thumbnail,
    model: publication.model,
    totalItems: children.length,
    eligibleItems,
    ineligibleItems: children.length - eligibleItems,
    children,
    summary: {
      totalItems: children.length,
      eligibleItems,
      ineligibleItems: children.length - eligibleItems,
      minPromotionPrice: minimum(children.map((child) => child.promotionPrice)),
      maxPromotionPrice: maximum(children.map((child) => child.promotionPrice)),
      minEstimatedNetAmount: minimum(children.map((child) => child.saleEstimate?.estimatedNetAmount ?? null)),
      maxEstimatedNetAmount: maximum(children.map((child) => child.saleEstimate?.estimatedNetAmount ?? null)),
      minMercadoLibreContributionAmount: minimum(children.map((child) => child.mercadoLibreContributionAmount)),
      maxMercadoLibreContributionAmount: maximum(children.map((child) => child.mercadoLibreContributionAmount)),
    },
  };
}

function mapChild(child: RawChild): PromotionAnalysisChild {
  const requiresPriceSelection = child.requiresPriceSelection || child.candidate?.price === 0;
  const promotionPrice = requiresPriceSelection ? null : child.candidate?.price ?? null;
  const originalPrice = child.candidate?.originalPrice ?? child.originalPrice;
  const contribution = contributionAmounts(child);
  return {
    itemId: child.itemId,
    variantLabel: child.variantLabel ?? attributeLabel(child.attributes),
    eligible: child.eligible,
    originalPrice,
    promotionPrice,
    discountPercent: promotionPrice === null || originalPrice === null || originalPrice <= 0
      ? null
      : child.candidate?.discountPercent ?? ((originalPrice - promotionPrice) / originalPrice) * 100,
    ...contribution,
    saleEstimate: child.saleEstimate,
    requiresPriceSelection,
    startDate: child.candidate?.startDate ?? null,
    finishDate: child.candidate?.finishDate ?? null,
  };
}

function contributionAmounts(child: RawChild) {
  const base = child.candidate?.mercadoLibreBaseContributionAmount ?? null;
  const boost = child.candidate?.mercadoLibreBoostAmount ?? null;
  const total = child.candidate?.mercadoLibreContributionAmount ?? sumAmounts(base, boost);
  return {
    mercadoLibreBaseContributionAmount: base,
    mercadoLibreBoostAmount: boost,
    mercadoLibreContributionAmount: total,
  };
}

function sumAmounts(base: number | null, boost: number | null): number | null {
  return base === null && boost === null ? null : (base ?? 0) + (boost ?? 0);
}

function attributeLabel(attributes: RawChild["attributes"]): string | null {
  const values = attributes.map((attribute) => attribute.valueName).filter((value): value is string => Boolean(value?.trim()));
  return values.length ? values.join(" · ") : null;
}

function minimum(values: readonly (number | null)[]): number | null {
  const present = values.filter((value): value is number => value !== null);
  return present.length ? Math.min(...present) : null;
}

function maximum(values: readonly (number | null)[]): number | null {
  const present = values.filter((value): value is number => value !== null);
  return present.length ? Math.max(...present) : null;
}
