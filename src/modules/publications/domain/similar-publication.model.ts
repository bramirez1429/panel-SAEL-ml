export type SimilarPublicationSourceType = "LEGACY" | "USER_PRODUCT";

export type SimilarPublicationAttributeValue = Readonly<{
  id: string | null;
  name: string | null;
}>;

export type SimilarPublicationAttributeOption = Readonly<{
  id: string | null;
  name: string | null;
  colorHex?: string | null;
}>;

export type SimilarPublicationAttributeRole =
  | "MAIN"
  | "VARIANT"
  | "IDENTIFIER"
  | "SIZE"
  | "COLOR"
  | "OTHER";

export type SimilarPublicationAttribute = Readonly<{
  id: string;
  name: string | null;
  valueId: string | null;
  valueName: string | null;
  values: readonly SimilarPublicationAttributeValue[];
  required?: boolean;
  editable?: boolean;
  inputType?: "TEXT" | "NUMBER" | "SELECT" | "TAGS";
  role?: SimilarPublicationAttributeRole;
  options?: readonly SimilarPublicationAttributeOption[];
  display?: Readonly<{ colorHex: string | null }>;
}>;

export type SimilarPublicationPackage = Readonly<{
  hasFactoryPackaging: boolean | null;
  widthCm: number | null;
  heightCm: number | null;
  lengthCm: number | null;
  weightKg: number | null;
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
  categoryName?: string | null;
  familyName: string | null;
  titleTemplate: string | null;
  description: string | null;
  currencyId: string | null;
  listingTypeId: string | null;
  buyingMode: string | null;
  saleTerms: readonly SimilarPublicationSaleTerm[];
  shipping: Readonly<{ freeShipping: boolean }> | null;
  channels: readonly string[];
  package?: SimilarPublicationPackage;
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
  package?: SimilarPublicationPackage;
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

export type SimilarPublicationErrorCause = Readonly<{
  code: string | null;
  message: string | null;
  department: string | null;
}>;

export type SimilarPublicationCreatedItem = Readonly<{
  variantKey: string;
  status: "CREATED" | "ERROR";
  itemId: string | null;
  userProductId: string | null;
  familyId: string | null;
  error: Readonly<{
    message: string;
    errorCode?: string;
    causes?: readonly SimilarPublicationErrorCause[];
  }> | null;
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
