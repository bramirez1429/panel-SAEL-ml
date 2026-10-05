import type { ReplicablePublication, ReplicationPreview } from "./replication.model";

export interface ReplicationRepository {
  getReplicablePublications(): Promise<readonly ReplicablePublication[]>;
  getPreviewBySource(sourceKey: string): Promise<ReplicationPreview>;
}
