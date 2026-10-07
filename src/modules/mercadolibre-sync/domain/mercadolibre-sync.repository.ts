import type { MercadolibreSyncProgress } from "./mercadolibre-sync.model";

export interface MercadolibreSyncRepository {
  start(): Promise<MercadolibreSyncProgress>;
  getStatus(syncId: string): Promise<MercadolibreSyncProgress>;
}
