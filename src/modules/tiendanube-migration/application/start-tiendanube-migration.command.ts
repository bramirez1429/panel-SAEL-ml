import type { TiendanubeMigrationRepository } from "../domain/tiendanube-migration.repository";

export class StartTiendanubeMigrationCommand {
  constructor(private readonly repository: TiendanubeMigrationRepository) {}

  execute() {
    return this.repository.start();
  }
}
