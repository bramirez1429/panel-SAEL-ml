import type { TiendanubeProductsPage, TiendanubeProductsRequest } from "../domain/tiendanube-products.model";
import type { TiendanubeProductsRepository } from "../domain/tiendanube-products.repository";

export class GetTiendanubeProductsQuery {
  constructor(private readonly repository: TiendanubeProductsRepository) {}

  execute(request: TiendanubeProductsRequest): Promise<TiendanubeProductsPage> {
    return this.repository.getProducts(request);
  }
}
