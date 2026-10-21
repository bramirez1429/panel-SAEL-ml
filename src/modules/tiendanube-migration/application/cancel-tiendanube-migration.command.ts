import type { TiendanubeMigrationRepository } from "../domain/tiendanube-migration.repository";

export class CancelTiendanubeMigrationCommand {
  constructor(private readonly repository: TiendanubeMigrationRepository) {}

  execute(jobId: string) {
    return this.repository.cancel(jobId);
  }
}
