import { PublicationPromotionWorkspace } from "@/modules/publication-workspace/presentation/publication-promotion-workspace.client";
import {
  searchWorkspacePublicationsAction,
  selectWorkspacePublicationAction,
  updateWorkspaceTitleAction,
} from "@/modules/publication-workspace/presentation/publication-workspace.actions";
import {
  updatePublicationAction,
  updatePublicationStatusAction,
} from "@/app/(dashboard)/publicaciones/[id]/update-publication.action";
import {
  getTiendanubeProductByMlAction,
  getTiendanubeReplicationStateAction,
  replicatePublicationAction,
} from "@/app/(dashboard)/publicaciones/tiendanube.action";
import type { TiendanubeCategory } from "@/modules/tiendanube/domain/tiendanube-replication.model";
import { getTiendanubeCategories } from "@/modules/tiendanube/tiendanube.composition.server";
import { AppError } from "@/shared/errors/app-error";

export default async function PublicationPromotionPage() {
  const tiendanubeCategories = await loadTiendanubeCategories();

  return (
    <PublicationPromotionWorkspace
      getTiendanubeStateAction={getTiendanubeReplicationStateAction}
      getTiendanubeProductByMlAction={getTiendanubeProductByMlAction}
      onSearch={searchWorkspacePublicationsAction}
      onSelect={selectWorkspacePublicationAction}
      onSave={updatePublicationAction}
      onStatusChange={updatePublicationStatusAction}
      onTitleSave={updateWorkspaceTitleAction}
      replicateTiendanubeAction={replicatePublicationAction}
      tiendanubeCategories={tiendanubeCategories}
    />
  );
}

async function loadTiendanubeCategories(): Promise<readonly TiendanubeCategory[]> {
  try {
    return await getTiendanubeCategories();
  } catch (error: unknown) {
    if (error instanceof AppError) return [];
    throw error;
  }
}
