import { MercadolibreSyncView } from "@/modules/mercadolibre-sync/presentation/mercadolibre-sync-view.client";

import { getMercadolibreSyncStatusAction, startMercadolibreSyncAction } from "./actions";

export default function SincronizacionPage() {
  return <MercadolibreSyncView getStatusAction={getMercadolibreSyncStatusAction} startAction={startMercadolibreSyncAction} />;
}
