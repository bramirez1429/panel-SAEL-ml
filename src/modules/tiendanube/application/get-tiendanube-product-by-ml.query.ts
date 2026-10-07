import type { TiendanubeProductByMl } from "../domain/tiendanube-replication.model";
import type { TiendanubeReplicationRepository } from "../domain/tiendanube-replication.repository";

export class GetTiendanubeProductByMlQuery {
  constructor(private readonly repository: TiendanubeReplicationRepository) {}

  execute(itemId: string): Promise<TiendanubeProductByMl> {
    return this.repository.getProductByMl(itemId);
  }
}
