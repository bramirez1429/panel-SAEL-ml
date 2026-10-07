import type { MercadolibreSyncProgress } from "../domain/mercadolibre-sync.model";
import type { MercadolibreSyncRepository } from "../domain/mercadolibre-sync.repository";

export class GetMercadolibreSyncStatusQuery {
  constructor(private readonly repository: MercadolibreSyncRepository) {}

  execute(syncId: string): Promise<MercadolibreSyncProgress> {
    return this.repository.getStatus(syncId);
  }
}
