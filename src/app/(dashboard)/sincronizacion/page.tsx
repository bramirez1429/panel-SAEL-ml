import { MercadolibreSyncView } from "@/modules/mercadolibre-sync/presentation/mercadolibre-sync-view.client";

import {
  cancelMercadolibreSyncAction,
  getMercadolibreActiveSyncAction,
  getMercadolibreSyncStatusAction,
  startMercadolibreSyncAction,
} from "./actions";

export default function SincronizacionPage() {
  return <MercadolibreSyncView
    cancelAction={cancelMercadolibreSyncAction}
    getActiveAction={getMercadolibreActiveSyncAction}
    getStatusAction={getMercadolibreSyncStatusAction}
    startAction={startMercadolibreSyncAction}
  />;
}
