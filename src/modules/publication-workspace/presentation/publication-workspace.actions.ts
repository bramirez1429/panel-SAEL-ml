"use server";

import { searchWorkspacePublications } from "../application/search-workspace-publications";
import type {
  PublicationWorkspaceFamily,
  PublicationWorkspaceSearchResult,
  PublicationWorkspaceSelectionRequest,
  PublicationWorkspaceSelectionResult,
} from "../domain/publication-workspace.model";
import { createPublicationWorkspaceRepository } from "../publication-workspace.composition.server";

export async function searchWorkspacePublicationsAction(
  term: string,
): Promise<PublicationWorkspaceSearchResult> {
  try {
    return await searchWorkspacePublications(
      createPublicationWorkspaceRepository(),
      term,
    );
  } catch {
    return { status: "error" };
  }
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
): Promise<Readonly<
  | { ok: true; title: string; family?: PublicationWorkspaceFamily }
  | { ok: false; message: string }
>> {
  const title = input.title.trim();
  if (!title) return { ok: false, message: "El título no puede quedar vacío." };

  try {
    const result = await createPublicationWorkspaceRepository().updateTitle(
      input.target,
      title,
    );
    if (result.status === "failed") {
      return { ok: false, message: result.message };
    }

    if (result.family) {
      return {
        ok: true,
        title: result.family.familyName ?? title,
        family: result.family,
      };
    }

    return { ok: true, title };
  } catch {
    return { ok: false, message: "No se pudo actualizar el título." };
  }
}
