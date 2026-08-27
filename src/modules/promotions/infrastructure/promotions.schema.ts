import { z } from "zod";
const catalogCategorySchema = z.object({ id: z.string(), name: z.string(), path: z.array(z.string()) });
const categoryFacetSchema = catalogCategorySchema.extend({ count: z.number() });
const attribute = z.object({ id: z.string(), name: z.string(), values: z.array(z.object({ value: z.string(), count: z.number() })) });
export const facetsSchema = z.object({ categories: z.array(categoryFacetSchema), attributes: z.array(attribute) });
const row = z.object({ itemId: z.string(), familyId: z.string().nullable(), title: z.string(), thumbnail: z.string().nullable(), category: catalogCategorySchema, price: z.number(), publicationStatus: z.string(), attributes: z.array(z.object({ id: z.string(), name: z.string(), value: z.string() })), promotionSummary: z.object({ status: z.enum(["ACTIVE", "AVAILABLE", "PENDING", "NONE"]), activeTypes: z.array(z.string()), candidateTypes: z.array(z.string()), pendingTypes: z.array(z.string()) }) });
export const catalogSchema = z.object({ done: z.boolean(), nextCursor: z.string().nullable(), count: z.number(), publications: z.array(row) });
