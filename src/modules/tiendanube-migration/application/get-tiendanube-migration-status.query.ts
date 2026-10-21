import type { TiendanubeMigrationRepository } from "../domain/tiendanube-migration.repository";

export class GetTiendanubeMigrationStatusQuery {
  constructor(private readonly repository: TiendanubeMigrationRepository) {}

  execute(jobId: string) {
    return this.repository.getStatus(jobId);
  }
}
