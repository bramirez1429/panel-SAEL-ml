import type { ReplicationRepository } from "../domain/replication.repository";

export class GetReplicablePublicationsQuery {
  constructor(private readonly repository: ReplicationRepository) {}

  execute() {
    return this.repository.getReplicablePublications();
  }
}
