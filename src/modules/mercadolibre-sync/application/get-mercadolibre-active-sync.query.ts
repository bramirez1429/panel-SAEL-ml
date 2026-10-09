import type { MercadolibreSyncProgress } from "../domain/mercadolibre-sync.model";
import type { MercadolibreSyncRepository } from "../domain/mercadolibre-sync.repository";

export class GetMercadolibreActiveSyncQuery {
  constructor(private readonly repository: MercadolibreSyncRepository) {}

  execute(): Promise<MercadolibreSyncProgress | null> {
    return this.repository.getActive();
  }
}
