export const catalogColors = ["rosa", "lila", "blanco"] as const;

export type CatalogColor = (typeof catalogColors)[number];

export type CatalogProduct = Readonly<{
  id: string;
  name: string;
  image: string;
  colors: CatalogColor[];
}>;
