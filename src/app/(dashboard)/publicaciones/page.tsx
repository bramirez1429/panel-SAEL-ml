import { createGetPublicationsQuery } from "@/modules/publications/publications.composition.server";
import type { PublicationsPage } from "@/modules/publications/domain/publication.model";
import { PublicationsView } from "@/modules/publications/presentation/publications-view";
import {
  parsePublicationsSearchParams,
  PUBLICATIONS_PAGE_SIZE,
  type PublicationSearchParamsInput,
  type PublicationsUrlState,
} from "@/modules/publications/presentation/publications-search-params";
import { AppError } from "@/shared/errors/app-error";
import { PageHeader } from "@/shared/ui/page-header/page-header";

export const dynamic = "force-dynamic";

type PublicationsPageProps = Readonly<{
  searchParams: Promise<PublicationSearchParamsInput>;
}>;

type PublicationsLoadResult =
  | Readonly<{ state: "empty" | "success"; page: PublicationsPage }>
  | Readonly<{ state: "error"; errorMessage: string }>;

async function loadPublications(
  filters: PublicationsUrlState,
): Promise<PublicationsLoadResult> {
  try {
    const page = await createGetPublicationsQuery().execute({
      page: filters.page,
      pageSize: PUBLICATIONS_PAGE_SIZE,
      cursor: filters.cursor,
      search: filters.search,
      type: filters.type,
      status: filters.status || null,
    });
    return {
      state: page.publications.length === 0 ? "empty" : "success",
      page,
    };
  } catch (error: unknown) {
    if (error instanceof AppError) {
      return {
        state: "error",
        errorMessage: `${error.message} Código: ${error.code}.`,
      };
    }

    throw error;
  }
}

export default async function PublicationsPage({
  searchParams,
}: PublicationsPageProps) {
  const filters = parsePublicationsSearchParams(await searchParams);
  const result = await loadPublications(filters);

  return (
    <>
      <PageHeader
        description="Gestiona las publicaciones de tus canales de venta."
      />
      <PublicationsView filters={filters} {...result} />
    </>
  );
}
