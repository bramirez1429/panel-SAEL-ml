import { TiendanubeSizeRenameView } from "@/modules/tiendanube-size-rename/presentation/tiendanube-size-rename-view.client";
import { applyStockBatchAction, checkSizeStockReadyAction, loadSizeCatalogPageAction } from "./actions";

export const dynamic = "force-dynamic";

export default function TiendanubeSizeRenamePage() {
  return <TiendanubeSizeRenameView loadPageAction={loadSizeCatalogPageAction} applyStockBatchAction={applyStockBatchAction} checkSizeStockReadyAction={checkSizeStockReadyAction} />;
}
