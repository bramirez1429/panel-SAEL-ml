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
import { createGetTiendanubeReplicationStatusQuery } from "@/modules/tiendanube/tiendanube.composition.server";
import { getTiendanubeCategories } from "@/modules/tiendanube/tiendanube.composition.server";
import type { TiendanubeCategory } from "@/modules/tiendanube/domain/tiendanube-replication.model";
import { replicatePublicationAction } from "./tiendanube.action";
import type { TiendanubeReplicationState } from "@/modules/tiendanube/domain/tiendanube-replication.model";
import { deletePublicationVariationAction, updatePublicationAction } from "./[id]/update-publication.action";
import { loadPublicationVariantsAction } from "./load-publication-variants.action";
import {
  createBulkStockJobAction,
  getBulkStockJobAction,
  previewBulkStockAction,
} from "./bulk-stock.action";

export const dynamic = "force-dynamic";

type PublicationsPageProps = Readonly<{
  searchParams: Promise<PublicationSearchParamsInput>;
}>;

type PublicationsLoadResult =
  | Readonly<{ state: "empty" | "success"; page: PublicationsPage; tiendanubeStatusBySourceKey: Readonly<Record<string, TiendanubeReplicationState>>; categories: readonly TiendanubeCategory[]; categoriesError: string | null }>
  | Readonly<{ state: "error"; errorMessage: string }>;

async function loadPublications(
  filters: PublicationsUrlState,
): Promise<PublicationsLoadResult> {
  try {
    const categoriesPromise = getTiendanubeCategories().then((categories) => ({
      categories,
      categoriesError: null,
    })).catch((error: unknown) => {
      if (error instanceof AppError) {
        return { categories: [] as readonly TiendanubeCategory[], categoriesError: "No se pudieron cargar las categorías de Tiendanube." };
      }

      throw error;
    });
    const page = await createGetPublicationsQuery().execute({
      page: filters.page,
      pageSize: PUBLICATIONS_PAGE_SIZE,
      cursor: filters.cursor,
      search: filters.search,
      type: filters.type,
      status: filters.status || null,
      quickFilters: filters.quickFilters,
    });
    const [states, categoriesResult] = await Promise.all([
      loadTiendanubeStatuses(page.publications.map((publication) => publication.group.key)),
      categoriesPromise,
    ]);
    return {
      state: page.publications.length === 0 ? "empty" : "success",
      page,
      tiendanubeStatusBySourceKey: states,
      categories: categoriesResult.categories,
      categoriesError: categoriesResult.categoriesError,
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
  } catch (error: unknown) {
    if (!(error instanceof AppError)) {
      throw error;
    }

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
    <PublicationsView filters={filters} replicateAction={replicatePublicationAction} updateAction={updatePublicationAction} deleteVariationAction={deletePublicationVariationAction} loadVariantsAction={loadPublicationVariantsAction} previewBulkStockAction={previewBulkStockAction} createBulkStockJobAction={createBulkStockJobAction} getBulkStockJobAction={getBulkStockJobAction} tiendanubeStatusBySourceKey={result.state === "error" ? {} : result.tiendanubeStatusBySourceKey} categories={result.state === "error" ? [] : result.categories} categoriesError={result.state === "error" ? null : result.categoriesError} {...result} />
  );
}
