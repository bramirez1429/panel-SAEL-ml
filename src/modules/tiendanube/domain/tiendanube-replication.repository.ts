import type { TiendanubeReplicationState } from "./tiendanube-replication.model";

export interface TiendanubeReplicationRepository {
  getStatuses(sourceKeys: readonly string[]): Promise<readonly TiendanubeReplicationState[]>;
  replicate(sourceId: string): Promise<import("./tiendanube-replication.model").TiendanubeReplicationAction>;
}
