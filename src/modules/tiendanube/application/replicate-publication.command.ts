import type { TiendanubeReplicationRepository } from "../domain/tiendanube-replication.repository";
import type { ReplicationOptions } from "../domain/tiendanube-replication.model";

/** Ejecuta una réplica individual; no conoce HTTP, cookies ni componentes. */
export class ReplicatePublicationCommand {
  constructor(private readonly repository: TiendanubeReplicationRepository) {}

  execute(sourceKey: string, options: ReplicationOptions) {
    return this.repository.replicate(sourceKey, options);
  }
}
