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
