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
  price: number | null;
  currency: string | null;
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
