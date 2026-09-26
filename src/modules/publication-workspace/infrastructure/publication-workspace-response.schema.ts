import { z } from "zod";

const searchItemSchema = z.object({
  itemId: z.string().min(1),
  familyId: z.string().nullable(),
  userProductId: z.string().nullable(),
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

export const publicationWorkspaceDetailResponseSchema = z.object({
  model: z.enum(["SHARED", "VARIANT_PRICING"]),
  itemId: z.string().min(1),
  title: z.string().nullable(),
  familyId: z.string().nullable(),
  status: z.string().nullable(),
  sku: z.string().nullable(),
  stock: z.object({
    available: z.number().int().nonnegative(),
  }),
  price: z.object({
    current: z.number().nullable(),
    currency: z.string().nullable(),
  }),
  thumbnail: z.string().nullable(),
  pictures: z.array(
    z.object({
      secure_url: z.string().nullable().optional(),
      url: z.string().nullable().optional(),
    }),
  ),
});

const familyPictureSchema = z.object({
  secure_url: z.string().nullable().optional(),
  url: z.string().nullable().optional(),
});

export const publicationWorkspaceFamilyResponseSchema = z.object({
  model: z.literal("VARIANT_PRICING"),
  familyId: z.string().min(1),
  familyName: z.string().nullable(),
  variants: z.array(
    z.object({
      userProductId: z.string().min(1),
      items: z.array(z.object({
        itemId: z.string().min(1),
        title: z.string().nullable(),
        status: z.string().nullable(),
        stock: z.number().int().nonnegative(),
        price: z.number().nullable(),
        thumbnail: z.string().nullable(),
        pictures: z.array(familyPictureSchema),
      })),
    }),
  ),
});
