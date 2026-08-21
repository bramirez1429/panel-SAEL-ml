import { createGetPublicationsQuery } from "@/modules/publications/publications.composition.server";
import type { PublicationsPage } from "@/modules/publications/domain/publication.model";
import { PublicationsView } from "@/modules/publications/presentation/publications-view";
import { AppError } from "@/shared/errors/app-error";
import { PageHeader } from "@/shared/ui/page-header/page-header";

export const dynamic = "force-dynamic";

async function loadPublications(): Promise<PublicationsPage | null> {
  try {
    return await createGetPublicationsQuery().execute();
  } catch (error: unknown) {
    if (error instanceof AppError) {
      return null;
    }

    throw error;
  }
}

export default async function PublicationsPage() {
  const publicationsPage = await loadPublications();

  return (
    <>
      <PageHeader
        description="Gestiona las publicaciones de tus canales de venta."
      />
      <PublicationsView page={publicationsPage} />
    </>
  );
}
