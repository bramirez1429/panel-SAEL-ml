import { z } from "zod";

const searchItemSchema = z.object({
  itemId: z.string().min(1),
  familyId: z.string().nullable(),
  userProductId: z.string().nullable().optional(),
  title: z.string().nullable(),
  thumbnail: z.string().nullable(),
  price: z.number().nullable(),
  currencyId: z.string().nullable(),
  status: z.string().nullable(),
  stock: z.number().int().nonnegative().nullable(),
  sold: z.number().int().nonnegative().nullable(),
  permalink: z.string().nullable(),
  model: z.enum(["SHARED", "VARIANT_PRICING"]),
});

export const publicationWorkspaceSearchResponseSchema = z.object({
  criteria: z.discriminatedUnion("type", [
    z.object({ type: z.literal("FAMILY"), value: z.string() }),
    z.object({ type: z.literal("MLA"), value: z.string() }),
    z.object({ type: z.literal("MLAU"), value: z.string() }),
    z.object({ type: z.literal("TITLE"), value: z.string() }),
  ]),
  done: z.boolean(),
  nextCursor: z.string().nullable(),
  itemsCount: z.number().int().nonnegative(),
  items: z.array(searchItemSchema),
});

const pictureSchema = z.object({
  secure_url: z.string().nullable().optional(),
  url: z.string().nullable().optional(),
});

const commercialPriceSchema = z.object({
  current: z.number().nullable(),
  regular: z.number().nullable(),
  standard: z.number().nullable(),
  currency: z.string().nullable(),
});

const commercialFriendlySchema = z.object({
  pricing: z.object({
    current: z.number().nullable(),
    regular: z.number().nullable(),
    standard: z.number().nullable(),
    currency: z.string().nullable(),
    hasDiscount: z.boolean(),
    discountPercent: z.number().nonnegative(),
  }),
  promotion: z.object({
    hasActivePromotion: z.boolean(),
    activeCount: z.number().int().nonnegative(),
    candidateCount: z.number().int().nonnegative(),
    pendingCount: z.number().int().nonnegative(),
  }),
});

export const publicationWorkspaceDetailResponseSchema = z.object({
  model: z.enum(["SHARED", "VARIANT_PRICING"]),
  itemId: z.string().min(1),
  title: z.string().nullable(),
  familyId: z.string().nullable(),
  status: z.string().nullable(),
  sku: z.string().nullable(),
  stock: z.object({
    available: z.number().int().nonnegative(),
    sold: z.number().int().nonnegative(),
  }),
  price: commercialPriceSchema,
  friendly: commercialFriendlySchema,
  installmentLabel: z.string().min(1).nullable().optional(),
  thumbnail: z.string().nullable(),
  pictures: z.array(pictureSchema),
});

export const publicationWorkspaceFamilyResponseSchema = z.object({
  model: z.literal("VARIANT_PRICING"),
  familyId: z.string().min(1),
  familyName: z.string().nullable(),
  itemsCount: z.number().int().nonnegative(),
  variants: z.array(
    z.object({
      itemId: z.string().min(1),
      userProductId: z.string().nullable(),
      title: z.string().nullable(),
      status: z.string().nullable(),
      stock: z.object({
        available: z.number().int().nonnegative(),
        sold: z.number().int().nonnegative(),
      }),
      sku: z.object({
        sellerCustomField: z.string().nullable(),
        inventoryId: z.string().nullable(),
      }),
      price: commercialPriceSchema,
      friendly: commercialFriendlySchema,
      installmentLabel: z.string().min(1).nullable().optional(),
      thumbnail: z.string().nullable(),
      pictures: z.array(pictureSchema),
    }),
  ),
});

export const publicationWorkspaceFamilyTaskResponseSchema = z.object({
  task_id: z.string().min(1),
  status: z.string().min(1),
});

const familyTaskReasonSchema = z.object({
  code: z.string().optional(),
  message: z.string().optional(),
});

const familyTaskUserProductSchema = z.object({
  id: z.string().min(1),
  status: z.string().min(1),
  reasons: z.array(familyTaskReasonSchema).nullable().optional(),
});

export const publicationWorkspaceFamilyTaskStatusSchema = z.object({
  task_id: z.string().min(1),
  status: z.string().min(1),
  user_products: z.array(familyTaskUserProductSchema).optional(),
  "user-products": z.array(familyTaskUserProductSchema).optional(),
}).transform((task) => ({
  task_id: task.task_id,
  status: task.status,
  user_products: task.user_products ?? task["user-products"],
}));
