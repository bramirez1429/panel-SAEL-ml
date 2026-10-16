import { getTiendanubeCategories } from "@/modules/tiendanube/tiendanube.composition.server";
import { TiendanubeBulkEditView } from "@/modules/tiendanube-bulk-edit/presentation/tiendanube-bulk-edit-view.client";
import { getActiveBulkEditAction, getBulkEditCategorySummaryAction, previewBulkEditAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function TiendanubeBulkEditPage() {
  const result = await getTiendanubeCategories().then(
    (categories) => ({ categories, categoryError: null }),
    () => ({ categories: [], categoryError: "No se pudieron cargar las categorías de Tiendanube." }),
  );
  return <TiendanubeBulkEditView {...result} getActiveAction={getActiveBulkEditAction} getCategorySummaryAction={getBulkEditCategorySummaryAction} previewAction={previewBulkEditAction} />;
}
