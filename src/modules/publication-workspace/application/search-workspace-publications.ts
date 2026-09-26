import { parsePublicationSearch } from "@/shared/lib/publication-search";

import type { PublicationWorkspaceSearchResult } from "../domain/publication-workspace.model";
import type { PublicationWorkspaceRepository } from "../domain/publication-workspace.repository";

export async function searchWorkspacePublications(
  repository: PublicationWorkspaceRepository,
  term: string,
): Promise<PublicationWorkspaceSearchResult> {
  const criteria = parsePublicationSearch(term);

  if (!criteria) {
    return { status: "success", searchType: "TITLE", query: "", items: [] };
  }

  const limit = criteria.type === "MLA" ? 1 : 4;
  const items = await repository.search({
    query: criteria.value,
    limit,
  });

  return {
    status: "success",
    searchType: criteria.type,
    query: criteria.value,
    items: criteria.type === "TITLE"
      ? items.slice(0, 4)
      : criteria.type === "MLA"
        ? items.slice(0, 1)
        : items,
  };
}
