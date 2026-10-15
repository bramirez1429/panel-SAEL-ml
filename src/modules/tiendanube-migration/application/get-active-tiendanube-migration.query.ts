import type { TiendanubeMigrationRepository } from "../domain/tiendanube-migration.repository";

export class GetActiveTiendanubeMigrationQuery {
  constructor(private readonly repository: TiendanubeMigrationRepository) {}

  execute() {
    return this.repository.getActive();
  }
}
