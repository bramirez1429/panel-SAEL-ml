import { ApiError } from "@/shared/api/api-error";
import { createGetTiendanubeProductsQuery } from "@/modules/tiendanube/tiendanube.composition.server";
import { TiendanubeProductsPageClient } from "@/modules/tiendanube/presentation/tiendanube-products-page.client";

export const dynamic = "force-dynamic";

type Props = Readonly<{
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}>;

const PRODUCT_PAGE_SIZE = 20;

export default async function TiendanubeProductsPage({ searchParams }: Props) {
  const params = await searchParams;
  const activeSearch = first(params.q)?.trim() ?? "";
  const page = parsePage(first(params.page));

  try {
    const productsPage = await createGetTiendanubeProductsQuery().execute({
      q: activeSearch,
      page,
      pageSize: PRODUCT_PAGE_SIZE,
    });
    return <TiendanubeProductsPageClient key={`${activeSearch}:${page}`} activeSearch={activeSearch} page={productsPage} />;
  } catch (error: unknown) {
    const message = error instanceof ApiError
      ? error.message
      : "No se pudieron cargar los productos de Tiendanube.";
    return <TiendanubeProductsPageClient activeSearch={activeSearch} errorMessage={message} page={null} />;
  }
}

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function parsePage(value: string | undefined): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
}
