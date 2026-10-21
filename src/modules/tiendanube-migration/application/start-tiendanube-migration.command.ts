import type { TiendanubeMigrationRepository } from "../domain/tiendanube-migration.repository";

export class StartTiendanubeMigrationCommand {
  constructor(private readonly repository: TiendanubeMigrationRepository) {}

  execute(testLimit?: 1 | 5 | 10) {
    return this.repository.start(testLimit);
  }
}
