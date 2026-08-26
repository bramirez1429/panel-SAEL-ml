import type { ReplicationOptions, TiendanubeCategory, TiendanubeReplicationState, TiendanubeStoreSummary } from "./tiendanube-replication.model";

export interface TiendanubeReplicationRepository {
  getStatuses(sourceKeys: readonly string[]): Promise<readonly TiendanubeReplicationState[]>;
  replicate(sourceKey: string, options: ReplicationOptions): Promise<import("./tiendanube-replication.model").TiendanubeReplicationAction>;
  getCategories(): Promise<readonly TiendanubeCategory[]>;
  getStoreSummary(): Promise<TiendanubeStoreSummary>;
}
