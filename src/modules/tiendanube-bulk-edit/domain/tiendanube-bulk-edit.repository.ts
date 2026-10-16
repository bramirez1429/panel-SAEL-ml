import type { TiendanubeBulkEditCategorySummary, TiendanubeBulkEditJob, TiendanubeBulkEditPreview, TiendanubeBulkEditRequest } from "./tiendanube-bulk-edit.model";

export interface TiendanubeBulkEditRepository {
  getCategorySummary(categoryId: number): Promise<TiendanubeBulkEditCategorySummary>;
  preview(request: TiendanubeBulkEditRequest): Promise<TiendanubeBulkEditPreview>;
  getActive(): Promise<TiendanubeBulkEditJob | null>;
}
