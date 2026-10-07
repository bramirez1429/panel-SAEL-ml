import type { MercadolibreSyncProgress } from "../domain/mercadolibre-sync.model";
import type { MercadolibreSyncRepository } from "../domain/mercadolibre-sync.repository";

export class StartMercadolibreSyncCommand {
  constructor(private readonly repository: MercadolibreSyncRepository) {}

  execute(): Promise<MercadolibreSyncProgress> {
    return this.repository.start();
  }
}
