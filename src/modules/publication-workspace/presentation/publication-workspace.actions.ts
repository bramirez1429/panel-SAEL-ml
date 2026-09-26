"use server";

import { searchWorkspacePublications } from "../application/search-workspace-publications";
import type {
  PublicationWorkspaceSearchResult,
  PublicationWorkspaceSelectionRequest,
  PublicationWorkspaceSelectionResult,
} from "../domain/publication-workspace.model";
import { createPublicationWorkspaceRepository } from "../publication-workspace.composition.server";

export async function searchWorkspacePublicationsAction(
  term: string,
): Promise<PublicationWorkspaceSearchResult> {
  return searchWorkspacePublications(
    createPublicationWorkspaceRepository(),
    term,
  );
}

export async function selectWorkspacePublicationAction(
  request: PublicationWorkspaceSelectionRequest,
): Promise<PublicationWorkspaceSelectionResult> {
  const repository = createPublicationWorkspaceRepository();
  if (request.familyId) {
    const family = await repository.getFamily(request.familyId);
    const requestedIds = request.itemIds ? new Set(request.itemIds) : null;
    return {
      status: "success",
      selection: {
        ...family,
        children: family.children.filter(
          (item) =>
            !requestedIds || requestedIds.has(item.itemId),
        ),
      },
    };
  }
  if (!request.itemId) return { status: "error" };

  const publication = await repository.getById(request.itemId);
  return {
    status: "success",
    selection: { type: "publication", publication },
  };
}

export async function updateWorkspaceTitleAction(
  input: Readonly<{
    target:
      | Readonly<{ type: "publication"; itemId: string }>
      | Readonly<{ type: "family"; familyId: string }>;
    title: string;
  }>,
): Promise<Readonly<{ ok: true; title: string } | { ok: false; message: string }>> {
  const title = input.title.trim();
  if (!title) return { ok: false, message: "El título no puede quedar vacío." };

  try {
    await createPublicationWorkspaceRepository().updateTitle(input.target, title);
    return { ok: true, title };
  } catch {
    return { ok: false, message: "No se pudo actualizar el título." };
  }
}
