export type TiendaNegocioCatalogProduct = Readonly<{
  sourceKey: string;
  title: string | null;
  mlaIds: readonly string[];
  familyId: string | null;
  mlauIds: readonly string[];
}>;

export type TiendaNegocioCatalogPage = Readonly<{
  products: readonly TiendaNegocioCatalogProduct[];
  nextCursor: string | null;
  finished: boolean;
}>;

export type TiendaNegocioStatus = Readonly<{
  connected: boolean;
  migrationEnabled: boolean;
  stage: string;
  documentation: string;
}>;

export type TiendaNegocioProductPreview = Readonly<{
  sourceKey: string;
  name: string;
  variantCount: number;
  imageCount: number;
  totalStock: number;
  prices: readonly number[];
  attributes: readonly string[];
  publicationStatus: "DRAFT";
  readyToMigrate: boolean;
  note: string;
}>;
