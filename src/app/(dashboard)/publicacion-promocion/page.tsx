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

export default function PublicationPromotionPage() {
  return (
    <PublicationPromotionWorkspace
      onSearch={searchWorkspacePublicationsAction}
      onSelect={selectWorkspacePublicationAction}
      onSave={updatePublicationAction}
      onStatusChange={updatePublicationStatusAction}
      onTitleSave={updateWorkspaceTitleAction}
    />
  );
}
