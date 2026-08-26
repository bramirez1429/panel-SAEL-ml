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
import { createGetTiendanubeReplicationStatusQuery } from "@/modules/tiendanube/tiendanube.composition.server";
import { getTiendanubeCategories, getTiendanubeStoreSummary } from "@/modules/tiendanube/tiendanube.composition.server";
import type { TiendanubeCategory, TiendanubeStoreSummary } from "@/modules/tiendanube/domain/tiendanube-replication.model";
import { replicatePublicationAction } from "./tiendanube.action";
import type { TiendanubeReplicationState } from "@/modules/tiendanube/domain/tiendanube-replication.model";

export const dynamic = "force-dynamic";

type PublicationsPageProps = Readonly<{
  searchParams: Promise<PublicationSearchParamsInput>;
}>;

type PublicationsLoadResult =
  | Readonly<{ state: "empty" | "success"; page: PublicationsPage; tiendanubeStatusBySourceKey: Readonly<Record<string, TiendanubeReplicationState>>; categories: readonly TiendanubeCategory[]; storeSummary: TiendanubeStoreSummary | null }>
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
    const states = await loadTiendanubeStatuses(page.publications.map((publication) => publication.group.key));
    const [categories, storeSummary] = await Promise.all([
      getTiendanubeCategories().catch(() => [] as readonly TiendanubeCategory[]),
      getTiendanubeStoreSummary().catch(() => null),
    ]);
    return {
      state: page.publications.length === 0 ? "empty" : "success",
      page,
      tiendanubeStatusBySourceKey: states,
      categories,
      storeSummary,
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

async function loadTiendanubeStatuses(sourceKeys: readonly string[]): Promise<Readonly<Record<string, TiendanubeReplicationState>>> {
  if (sourceKeys.length === 0) return {};
  try {
    const states = await createGetTiendanubeReplicationStatusQuery().execute(sourceKeys);
    return Object.fromEntries(states.map((state) => [state.sourceKey, state]));
  } catch {
    return Object.fromEntries(sourceKeys.map((sourceKey) => [sourceKey, {
      sourceKey,
      status: "UNKNOWN" as const,
      tiendanubeProductId: null,
    }]));
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
      <PublicationsView filters={filters} replicateAction={replicatePublicationAction} tiendanubeStatusBySourceKey={result.state === "error" ? {} : result.tiendanubeStatusBySourceKey} categories={result.state === "error" ? [] : result.categories} storeSummary={result.state === "error" ? null : result.storeSummary} {...result} />
    </>
  );
}
