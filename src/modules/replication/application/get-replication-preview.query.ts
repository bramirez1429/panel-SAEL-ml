import type { ReplicationRepository } from "../domain/replication.repository";

export class GetReplicationPreviewQuery {
  constructor(private readonly repository: ReplicationRepository) {}

  execute(sourceKey: string) {
    return this.repository.getPreviewBySource(sourceKey);
  }
}
