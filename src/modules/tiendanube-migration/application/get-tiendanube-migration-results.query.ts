import type { TiendanubeMigrationOutcome } from "../domain/tiendanube-migration.model";
import type { TiendanubeMigrationRepository } from "../domain/tiendanube-migration.repository";

export class GetTiendanubeMigrationResultsQuery {
  constructor(private readonly repository: TiendanubeMigrationRepository) {}

  execute(jobId: string, outcome: TiendanubeMigrationOutcome, page: number, pageSize: number) {
    return this.repository.getResults(jobId, outcome, page, pageSize);
  }
}
