import type { ReplicablePublication, ReplicationPreview, ReplicationVisitsProduct, ReplicationVisitsResult } from "./replication.model";

export interface ReplicationRepository {
  getReplicablePublications(): Promise<readonly ReplicablePublication[]>;
  getVisits(products: readonly ReplicationVisitsProduct[]): Promise<readonly ReplicationVisitsResult[]>;
  getPreviewBySource(sourceKey: string): Promise<ReplicationPreview>;
}
