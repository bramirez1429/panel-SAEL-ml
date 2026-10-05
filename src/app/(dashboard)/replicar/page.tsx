import { AppError } from "@/shared/errors/app-error";
import { PageHeader } from "@/shared/ui/page-header/page-header";
import { createGetReplicablePublicationsQuery } from "@/modules/replication/replication.composition.server";
import { replicatePublicationAction } from "../publicaciones/tiendanube.action";
import { loadReplicationCategoriesAction, loadReplicationPreviewAction } from "./actions";
import { ReplicationListClient } from "@/modules/replication/presentation/replication-list.client";

export const dynamic = "force-dynamic";

export default async function ReplicarPage() {
  try {
    const publications = await createGetReplicablePublicationsQuery().execute();
    return (
      <>
        <PageHeader description="Replicá publicaciones de Mercado Libre en Tiendanube de forma rápida." />
        <ReplicationListClient
          publications={publications}
          replicateAction={replicatePublicationAction}
          loadPreviewAction={loadReplicationPreviewAction}
          loadCategoriesAction={loadReplicationCategoriesAction}
        />
      </>
    );
  } catch (error: unknown) {
    return (
      <>
        <PageHeader description="Replicá publicaciones de Mercado Libre en Tiendanube de forma rápida." />
        <p>{error instanceof AppError ? error.message : "No se pudieron cargar las publicaciones para replicar."}</p>
      </>
    );
  }
}
