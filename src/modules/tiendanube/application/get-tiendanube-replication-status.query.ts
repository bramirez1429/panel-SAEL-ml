import type { TiendanubeReplicationState } from "../domain/tiendanube-replication.model";
import type { TiendanubeReplicationRepository } from "../domain/tiendanube-replication.repository";

/** Consulta en lote los estados sin mezclar Tiendanube con el dominio de publicaciones. */
export class GetTiendanubeReplicationStatusQuery {
  constructor(private readonly repository: TiendanubeReplicationRepository) {}

  execute(sourceKeys: readonly string[]): Promise<readonly TiendanubeReplicationState[]> {
    return this.repository.getStatuses(sourceKeys);
  }
}
