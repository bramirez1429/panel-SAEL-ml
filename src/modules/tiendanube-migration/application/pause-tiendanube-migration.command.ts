import type { TiendanubeMigrationRepository } from "../domain/tiendanube-migration.repository";

export class PauseTiendanubeMigrationCommand {
  constructor(private readonly repository: TiendanubeMigrationRepository) {}

  execute(jobId: string) {
    return this.repository.pause(jobId);
  }
}
