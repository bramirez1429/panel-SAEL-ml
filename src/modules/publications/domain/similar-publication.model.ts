export type SimilarPublicationSourceType = "LEGACY" | "USER_PRODUCT";

export type SimilarPublicationAttributeValue = Readonly<{
  id: string | null;
  name: string | null;
}>;

export type SimilarPublicationAttribute = Readonly<{
  id: string;
  name: string | null;
  valueId: string | null;
  valueName: string | null;
  values: readonly SimilarPublicationAttributeValue[];
}>;

export type SimilarPublicationSaleTerm = Readonly<{
  id: string;
  valueId: string | null;
  valueName: string | null;
}>;

export type SimilarPublicationVariant = Readonly<{
  sourceReference: string;
  price: number | null;
  stock: number | null;
  sku: null;
  attributes: readonly SimilarPublicationAttribute[];
  pictureIds: readonly string[];
}>;

export type SimilarPublicationDraft = Readonly<{
  sourceKey: string;
  sourceType: SimilarPublicationSourceType;
  categoryId: string | null;
  familyName: string | null;
  titleTemplate: string | null;
  description: string | null;
  currencyId: string | null;
  listingTypeId: string | null;
  buyingMode: string | null;
  saleTerms: readonly SimilarPublicationSaleTerm[];
  shipping: Readonly<{ freeShipping: boolean }> | null;
  channels: readonly string[];
  variants: readonly SimilarPublicationVariant[];
  pictures: readonly [];
}>;

export type SimilarPublicationCreateInput = Readonly<{
  sourceKey: string;
  categoryId: string;
  familyName: string | null;
  titleTemplate: string | null;
  description: string | null;
  currencyId: string;
  listingTypeId: string;
  buyingMode: string;
  saleTerms: readonly SimilarPublicationSaleTerm[];
  shipping: Readonly<{ freeShipping: boolean }> | null;
  channels: readonly string[];
  pictures: readonly string[];
  variants: readonly SimilarPublicationCreateVariant[];
}>;

export type SimilarPublicationCreateVariant = Readonly<{
  sourceReference: string;
  price: number;
  stock: number;
  sku: string | null;
  attributes: readonly SimilarPublicationAttribute[];
  pictureIds: readonly string[];
}>;

export type SimilarPublicationCreatedItem = Readonly<{
  variantKey: string;
  status: "CREATED" | "ERROR";
  itemId: string | null;
  userProductId: string | null;
  familyId: string | null;
  error: Readonly<{ message: string; errorCode?: string }> | null;
}>;

export type SimilarPublicationCreationResult = Readonly<{
  status: "SUCCESS" | "PARTIAL" | "FAILED";
  items: readonly SimilarPublicationCreatedItem[];
  newSourceKey: string | null;
}>;

export type SimilarPublicationPicture = Readonly<{
  id: string;
  secureUrl: string;
}>;

export function isSimilarPublicationSourceKey(value: string): boolean {
  return /^(?:item:MLA\d+|family:\d+)$/u.test(value);
}

const IDENTIFIER_ATTRIBUTE_IDS = new Set([
  "SELLER_SKU",
  "SKU",
  "GTIN",
  "GTIN14",
  "EAN",
  "UPC",
  "ISBN",
]);

export function isProductIdentifierAttribute(id: string): boolean {
  return IDENTIFIER_ATTRIBUTE_IDS.has(id.toUpperCase());
}
