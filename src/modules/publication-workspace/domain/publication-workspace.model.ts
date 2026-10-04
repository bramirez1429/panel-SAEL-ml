export type PublicationWorkspaceAttribute = Readonly<{
  id: string;
  name: string | null;
  value: string | null;
}>;

export type PublicationWorkspaceLegacyVariation = Readonly<{
  variationId: number;
  imageUrl: string | null;
  sku: string | null;
  stock: number | null;
  sold: number | null;
  price: number | null;
  color: string | null;
  size: string | null;
  attributes: readonly PublicationWorkspaceAttribute[];
}>;

export type PublicationWorkspaceItem = Readonly<{
  imageUrl: string | null;
  thumbnailUrl: string | null;
  title: string;
  itemId: string;
  familyId: string | null;
  model: "SHARED" | "VARIANT_PRICING";
  sku: string | null;
  status: string;
  stock: number;
  sold: number;
  price: number | null;
  standardPrice: number | null;
  regularPrice: number | null;
  currency: string | null;
  listingTypeId: string | null;
  hasActivePromotion: boolean;
  promotionDiscountPercent: number | null;
  installmentLabel: string | null;
  attributes?: readonly PublicationWorkspaceAttribute[];
  legacyVariations?: readonly PublicationWorkspaceLegacyVariation[];
}>;

export type PublicationWorkspaceFamily = Readonly<{
  type: "family";
  familyId: string;
  familyName: string | null;
  imageUrl: string | null;
  children: readonly PublicationWorkspaceItem[];
}>;

export type PublicationWorkspaceSelection =
  | Readonly<{ type: "publication"; publication: PublicationWorkspaceItem }>
  | PublicationWorkspaceFamily;

export type PublicationWorkspaceSearchItem = Readonly<{
  itemId: string;
  familyId: string | null;
  userProductId: string | null;
  title: string;
  imageUrl: string | null;
  price: number | null;
  currency: string | null;
  status: string | null;
  stock: number | null;
}>;

export type PublicationWorkspaceSearchResult =
  | Readonly<{
      status: "success";
      searchType: "FAMILY" | "MLA" | "MLAU" | "TITLE";
      query: string;
      items: readonly PublicationWorkspaceSearchItem[];
    }>
  | Readonly<{ status: "error" }>;

export type PublicationWorkspaceSelectionRequest = Readonly<{
  itemId?: string;
  familyId?: string;
  itemIds?: readonly string[];
}>;

export type PublicationWorkspaceSelectionResult =
  | Readonly<{ status: "success"; selection: PublicationWorkspaceSelection }>
  | Readonly<{ status: "error" }>;
