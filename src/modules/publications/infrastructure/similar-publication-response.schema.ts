import { z } from "zod";

const nullableText = z.string().nullable();

const attributeValueSchema = z.object({
  id: nullableText,
  name: nullableText,
});

const attributeSchema = z.object({
  id: z.string().min(1),
  name: nullableText,
  valueId: nullableText,
  valueName: nullableText,
  values: z.array(attributeValueSchema),
});

const variantSchema = z.object({
  sourceReference: z.string().min(1),
  price: z.number().finite().nullable(),
  stock: z.number().int().nullable(),
  sku: z.null(),
  attributes: z.array(attributeSchema),
  pictureIds: z.array(z.string()),
});

export const similarPublicationDraftSchema = z.object({
  sourceKey: z.string().min(1),
  sourceType: z.enum(["LEGACY", "USER_PRODUCT"]),
  categoryId: nullableText,
  familyName: nullableText,
  titleTemplate: nullableText,
  description: nullableText,
  currencyId: nullableText,
  listingTypeId: nullableText,
  buyingMode: nullableText,
  saleTerms: z.array(z.object({
    id: z.string().min(1),
    valueId: nullableText,
    valueName: nullableText,
  })),
  shipping: z.object({ freeShipping: z.boolean() }).nullable(),
  channels: z.array(z.string()),
  variants: z.array(variantSchema),
  pictures: z.tuple([]),
});

const createdItemSchema = z.object({
  variantKey: z.string(),
  status: z.enum(["CREATED", "ERROR"]),
  itemId: nullableText,
  userProductId: nullableText,
  familyId: nullableText,
  error: z.object({
    message: z.string(),
    errorCode: z.string().optional(),
  }).nullable(),
});

export const similarPublicationCreationSchema = z.object({
  status: z.enum(["SUCCESS", "PARTIAL", "FAILED"]),
  items: z.array(createdItemSchema),
  sourceKey: nullableText,
});

export const similarPublicationPictureSchema = z.object({
  id: z.string().min(1),
  secureUrl: z.string().url(),
});
