import type { TiendanubeReplicationRepository } from "../domain/tiendanube-replication.repository";

/** Ejecuta una réplica individual; no conoce HTTP, cookies ni componentes. */
export class ReplicatePublicationCommand {
  constructor(private readonly repository: TiendanubeReplicationRepository) {}

  execute(sourceKey: string) {
    return this.repository.replicate(sourceKey);
  }
}
