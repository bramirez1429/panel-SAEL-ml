import { TiendanubeMigrationView } from "@/modules/tiendanube-migration/presentation/tiendanube-migration-view.client";

import {
  getActiveTiendanubeMigrationAction,
  getTiendanubeMigrationResultsAction,
  getTiendanubeMigrationStatusAction,
  startTiendanubeMigrationAction,
  resumeOneTiendanubeMigrationAction,
} from "./actions";

export const dynamic = "force-dynamic";

export default function MigracionGlobalPage() {
  return <TiendanubeMigrationView
    getActiveAction={getActiveTiendanubeMigrationAction}
    getResultsAction={getTiendanubeMigrationResultsAction}
    getStatusAction={getTiendanubeMigrationStatusAction}
    startAction={startTiendanubeMigrationAction}
    resumeOneAction={resumeOneTiendanubeMigrationAction}
  />;
}
