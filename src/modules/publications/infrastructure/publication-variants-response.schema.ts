import { z } from "zod";

const attributeDtoSchema = z.object({
  id: z.string().min(1),
  name: z.string().optional(),
  value_name: z.string().nullable().optional(),
  values: z
    .array(
      z.object({
        id: z.string().nullable().optional(),
        name: z.string().nullable().optional(),
      }),
    )
    .optional(),
});

const familyItemSummaryDtoSchema = z.object({
  itemId: z.string().min(1),
  title: z.string().nullable(),
  price: z.number().nullable(),
  stock: z.number().nonnegative(),
  sold: z.number().nonnegative(),
  status: z.string().nullable(),
  inventoryId: z.string().nullable(),
  thumbnail: z.string().nullable(),
  pictures: z.array(z.unknown()),
  attributes: z.array(attributeDtoSchema),
});

export const familyVariantsResponseSchema = z.object({
  key: z.string().min(1),
  model: z.literal("VARIANT_PRICING"),
  familyId: z.string().min(1),
  familyName: z.string().nullable(),
  variantsCount: z.number().int().nonnegative(),
  itemsCount: z.number().int().nonnegative(),
  variants: z.array(
    z.object({
      userProductId: z.string().min(1),
      items: z.array(familyItemSummaryDtoSchema),
    }),
  ),
});

export type FamilyVariantsResponseDto = z.infer<
  typeof familyVariantsResponseSchema
>;
