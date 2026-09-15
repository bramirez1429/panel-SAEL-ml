import { z } from "zod";

const channelSchema = z.enum(["MERCADOLIBRE", "TIENDANUBE"]);

const mappingStatusSchema = z.enum([
  "LINKED",
  "AUTO_LINKED",
  "UNLINKED",
  "AMBIGUOUS",
]);

const nullableString = z.string().nullable();
const nullableStock = z.number().int().nonnegative().nullable();

export const recentSalesResponseSchema = z.object({
  hours: z.number().int().positive(),

  items: z.array(
    z.object({
      saleId: z.string().uuid(),
      channel: channelSchema,
      soldAt: z.string().min(1),
      quantity: z.number().int().positive(),
      productName: z.string(),
      sku: nullableString,

      mlItemId: nullableString,
      mlVariationId: nullableString,
      userProductId: nullableString,
      familyId: nullableString,

      tnProductId: nullableString,
      tnVariantId: nullableString,

      color: nullableString,
      size: nullableString,

      mlStock: nullableStock,
      tiendaNubeStock: nullableStock,

      stockDifference: z.number().int().nullable(),
      mappingStatus: mappingStatusSchema,
      lowStockCount: z.number().int().nonnegative(),
      hasStockDifference: z.boolean().nullable(),
    }),
  ),
});

const variantSchema = z.object({
  sku: nullableString,
  color: nullableString,
  size: nullableString,

  ml: z
    .object({
      itemId: z.string(),
      variationId: nullableString,
      userProductId: nullableString,
      familyId: nullableString,
      stock: nullableStock,
    })
    .nullable(),

  tiendaNube: z
    .object({
      productId: z.string(),
      variantId: z.string(),
      stock: nullableStock,
    })
    .nullable(),

  difference: z.number().int().nullable(),
  stockDifference: z.number().int().nullable(),
  hasStockDifference: z.boolean().nullable(),

  mappingStatus: mappingStatusSchema,

  stockStatus: z.enum(["OUT_OF_STOCK", "LOW", "OK"]).nullable(),
});

export const saleVariantsResponseSchema = z.object({
  sale: z.object({
    id: z.string().uuid(),
    channel: channelSchema,

    externalOrderId: z.string(),
    externalOrderItemId: z.string(),

    soldAt: z.string().min(1),
    quantity: z.number().int().positive(),
    productName: z.string(),
    sku: nullableString,

    mlItemId: nullableString,
    mlVariationId: nullableString,
    userProductId: nullableString,
    familyId: nullableString,

    tnProductId: nullableString,
    tnVariantId: nullableString,

    color: nullableString,
    size: nullableString,

    mappingStatus: mappingStatusSchema,

    createdAt: z.string().min(1),
    updatedAt: z.string().min(1),
  }),

  variants: z.array(variantSchema),
});


export const salesSyncResponseSchema = z.object({
  hours: z.number().int().positive(),
  mercadoLibre: z.object({
    found: z.number().int().nonnegative(),
    processed: z.number().int().nonnegative(),
    failed: z.number().int().nonnegative(),
  }),
});
