import type { ReplicationRepository } from "../domain/replication.repository";
import type { ReplicationVisitsProduct } from "../domain/replication.model";

export class GetReplicationVisitsQuery {
  constructor(private readonly repository: ReplicationRepository) {}

  execute(products: readonly ReplicationVisitsProduct[]) {
    return this.repository.getVisits(products);
  }
}
