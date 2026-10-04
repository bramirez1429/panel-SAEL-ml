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

  const limit = criteria.type === "MLA"
    ? 1
    : criteria.type === "TITLE"
      ? 4
      : 20;
  let result: Awaited<ReturnType<PublicationWorkspaceRepository["search"]>>;
  try {
    result = await repository.search({
      query: criteria.value,
      limit,
    });
  } catch {
    return { status: "error" };
  }
  return {
    status: "success",
    searchType: result.criteria.type,
    query: result.criteria.value,
    items: result.criteria.type === "TITLE"
      ? result.items.slice(0, 4)
      : result.criteria.type === "MLA"
        ? result.items.slice(0, 1)
        : result.items,
  };
}
