import type { TiendanubeBulkEditCategorySummary, TiendanubeBulkEditFailuresPage, TiendanubeBulkEditJob, TiendanubeBulkEditPreview, TiendanubeBulkEditRequest } from "./tiendanube-bulk-edit.model";

export interface TiendanubeBulkEditRepository {
  getCategorySummary(categoryId: number): Promise<TiendanubeBulkEditCategorySummary>;
  preview(request: TiendanubeBulkEditRequest): Promise<TiendanubeBulkEditPreview>;
  start(previewId: string): Promise<TiendanubeBulkEditJob>;
  getActive(): Promise<TiendanubeBulkEditJob | null>;
  getJob(jobId: string): Promise<TiendanubeBulkEditJob>;
  getFailures(jobId: string, page: number, pageSize: number): Promise<TiendanubeBulkEditFailuresPage>;
  retryFailures(jobId: string): Promise<TiendanubeBulkEditJob>;
}
