import type { TiendanubeMigrationRepository } from "../domain/tiendanube-migration.repository";

export class ResumeOneTiendanubeMigrationCommand {
  constructor(private readonly repository: TiendanubeMigrationRepository) {}

  execute(jobId: string) {
    return this.repository.resumeOne(jobId);
  }
}
