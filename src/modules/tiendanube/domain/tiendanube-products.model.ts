export type TiendanubeProductVariant = Readonly<{
  id: string;
  size: string | null;
  color: string | null;
  sku: string | null;
  stock: number | null;
  price: number | null;
  promotionalPrice: number | null;
}>;

export type TiendanubeProduct = Readonly<{
  id: string;
  name: string;
  imageUrl: string | null;
  status: string;
  tags: readonly string[];
  variants: readonly TiendanubeProductVariant[];
}>;

export type TiendanubeProductsRequest = Readonly<{
  q: string;
  page: number;
  pageSize: number;
}>;

export type TiendanubeProductsPage = Readonly<{
  products: readonly TiendanubeProduct[];
  page: number;
  pageSize: number;
  hasMore: boolean;
  total?: number;
}>;
