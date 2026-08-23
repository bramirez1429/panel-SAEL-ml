import type { PublicationDetail } from "@/modules/publications/domain/publication.model";
import {
  PublicationDetailError,
} from "@/modules/publications/presentation/publication-detail-states";
import { PublicationDetailView } from "@/modules/publications/presentation/publication-detail-view";
import { createGetPublicationByIdQuery } from "@/modules/publications/publications.composition.server";
import { ApiError } from "@/shared/api/api-error";
import { AppError } from "@/shared/errors/app-error";
import { PageHeader } from "@/shared/ui/page-header/page-header";
import { notFound } from "next/navigation";
import { updatePublicationAction } from "./update-publication.action";

export const dynamic = "force-dynamic";

type PublicationDetailPageProps = Readonly<{
  params: Promise<Readonly<{ id: string }>>;
  searchParams?: Promise<Readonly<Record<string, string | string[] | undefined>>>;
}>;

type PublicationDetailLoadResult =
  | Readonly<{ state: "success"; publication: PublicationDetail }>
  | Readonly<{ state: "error"; message: string }>;

async function loadPublicationDetail(
  id: string,
): Promise<PublicationDetailLoadResult> {
  try {
    const publication = await createGetPublicationByIdQuery().execute(id);

    return { state: "success", publication };
  } catch (error: unknown) {
    if (error instanceof ApiError && error.status === 404) {
      notFound();
    }

    if (error instanceof AppError) {
      return {
        state: "error",
        message: `${error.message} Código: ${error.code}.`,
      };
    }

    throw error;
  }
}

export default async function PublicationDetailPage({
  params,
  searchParams,
}: PublicationDetailPageProps) {
  const { id } = await params;
  const result = await loadPublicationDetail(id);
  const detailSearchParams = searchParams ? await searchParams : {};
  const returnTo = getReturnTo(detailSearchParams.returnTo);

  return (
    <>
      <PageHeader description="Consulta la información y las variantes de la publicación." />
      {result.state === "success" ? (
        <PublicationDetailView
          publication={result.publication}
          returnTo={returnTo}
          updateAction={updatePublicationAction}
        />
      ) : (
        <PublicationDetailError message={result.message} />
      )}
    </>
  );
}

function getReturnTo(value: string | string[] | undefined): string | undefined {
  const candidate = typeof value === "string" ? value : value?.[0];
  return candidate?.startsWith("/publicaciones") ? candidate : undefined;
}
