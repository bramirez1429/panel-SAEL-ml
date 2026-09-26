import type {
  PublicationWorkspaceFamily,
  PublicationWorkspaceItem,
  PublicationWorkspaceSearchItem,
} from "./publication-workspace.model";

export type PublicationWorkspaceSearchRequest = Readonly<{
  query: string;
  limit: number;
  cursor?: string;
}>;

export interface PublicationWorkspaceRepository {
  search(
    request: PublicationWorkspaceSearchRequest,
  ): Promise<readonly PublicationWorkspaceSearchItem[]>;
  getById(itemId: string): Promise<PublicationWorkspaceItem>;
  getFamily(familyId: string): Promise<PublicationWorkspaceFamily>;
  updateTitle(
    target:
      | Readonly<{ type: "publication"; itemId: string }>
      | Readonly<{ type: "family"; familyId: string }>,
    title: string,
  ): Promise<void>;
}
