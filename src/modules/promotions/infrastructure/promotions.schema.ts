import { z } from "zod";

const promotionSchema = z.object({
  id: z.string().nullable(),
  offerId: z.string().nullable(),
  type: z.string().nullable(),
  name: z.string().nullable(),
  originalPrice: z.number().nullable(),
  promotionPrice: z.number().nullable(),
  discountPercent: z.number().nullable(),
  startDate: z.string().nullable(),
  finishDate: z.string().nullable(),
});

export const optionsSchema = z.array(
  promotionSchema.extend({
    status: z.string().nullable(),
    minPromotionPrice: z.number().nullable(),
    maxPromotionPrice: z.number().nullable(),
    suggestedPromotionPrice: z.number().nullable(),
    requiresPriceSelection: z.boolean().nullable(),
    sellerDiscountAmount: z.number().nullable(),
    mercadoLibreBaseContributionAmount: z.number().nullable(),
    mercadoLibreBoostAmount: z.number().nullable(),
    mercadoLibreContributionAmount: z.number().nullable(),
    estimatedNetAmount: z.number().nullable(),
    suggestedEstimatedNetAmount: z.number().nullable(),
    canApply: z.boolean(),
    canRemove: z.boolean(),
    saleEstimate: z
      .object({ saleFeeAmount: z.number(), estimatedNetAmount: z.number() })
      .nullable(),
  }),
);

const rowSchema = z.object({
  itemId: z.string(),
  familyId: z.string().nullable(),
  title: z.string(),
  thumbnail: z.string().nullable(),
  productGroup: z.enum([
    "WOMEN_TSHIRT",
    "WOMEN_SWEATSHIRT",
    "GIRLS_TSHIRT",
    "GIRLS_SWEATSHIRT",
  ]),
  price: z.number(),
  currentPromotion: promotionSchema.nullable(),
  hasActivePromotion: z.boolean(),
  availablePromotionsCount: z.number().int().nonnegative(),
  promotionStatus: z.enum(["ACTIVE", "AVAILABLE", "PENDING", "NONE"]),
});

export const catalogSchema = z.object({
  done: z.boolean(),
  nextCursor: z.string().nullable(),
  count: z.number(),
  publications: z.array(rowSchema),
});

const snapshotSchema = z.object({
  id: z.string().nullable(),
  type: z.string().nullable(),
  offerId: z.string().nullable(),
  status: z.string().nullable(),
  price: z.number().nullable(),
  originalPrice: z.number().nullable(),
  startDate: z.string().nullable(),
  finishDate: z.string().nullable(),
});

export const publicationPreviewSchema = z.object({
  sourceKey: z.string(),
  totalItems: z.number().int().nonnegative(),
  applicableItems: z.number().int().nonnegative(),
  unavailableItems: z.number().int().nonnegative(),
  items: z.array(
    z.object({
      itemId: z.string(),
      price: z.number().nullable(),
      activePromotion: snapshotSchema.nullable(),
      candidates: z.array(snapshotSchema),
      requestedCandidate: snapshotSchema.nullable(),
      applicable: z.boolean(),
      unavailableReason: z.string().nullable(),
    }),
  ),
});

export const publicationResultSchema = z.object({
  success: z.boolean(),
  status: z.enum(["SUCCESS", "PARTIAL_FAILURE", "FAILURE"]),
  errorCode: z.string().optional(),
  providerMessage: z.string().optional(),
  totalItems: z.number().int().nonnegative(),
  successfulItems: z.number().int().nonnegative(),
  failedItems: z.number().int().nonnegative(),
  results: z.array(
    z.object({
      itemId: z.string(),
      success: z.boolean(),
      stage: z.string(),
      errorCode: z.string().optional(),
      providerMessage: z.string().optional(),
    }),
  ),
});
