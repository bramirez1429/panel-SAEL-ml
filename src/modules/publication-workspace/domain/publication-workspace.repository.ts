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

export type PublicationWorkspaceSearchCriteria = Readonly<{
  type: "FAMILY" | "MLA" | "MLAU" | "TITLE";
  value: string;
}>;

export type PublicationWorkspaceSearchResponse = Readonly<{
  criteria: PublicationWorkspaceSearchCriteria;
  items: readonly PublicationWorkspaceSearchItem[];
}>;

export type PublicationWorkspaceTitleUpdateResult =
  | Readonly<{
      status: "completed";
      family: PublicationWorkspaceFamily | null;
    }>
  | Readonly<{
      status: "failed";
      message: string;
    }>;

export interface PublicationWorkspaceRepository {
  search(
    request: PublicationWorkspaceSearchRequest,
  ): Promise<PublicationWorkspaceSearchResponse>;
  getById(itemId: string): Promise<PublicationWorkspaceItem>;
  getFamily(familyId: string): Promise<PublicationWorkspaceFamily>;
  updateTitle(
    target:
      | Readonly<{ type: "publication"; itemId: string }>
      | Readonly<{ type: "family"; familyId: string }>,
    title: string,
  ): Promise<PublicationWorkspaceTitleUpdateResult>;
}
