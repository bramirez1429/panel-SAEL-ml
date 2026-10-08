import type { TiendanubeProductsPage, TiendanubeProductsRequest } from "./tiendanube-products.model";

export interface TiendanubeProductsRepository {
  getProducts(request: TiendanubeProductsRequest): Promise<TiendanubeProductsPage>;
}
