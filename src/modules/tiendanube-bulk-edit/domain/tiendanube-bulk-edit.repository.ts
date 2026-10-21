import type { TiendanubeBulkEditCategorySummary, TiendanubeBulkEditFailure, TiendanubeBulkEditJob, TiendanubeBulkEditPreview, TiendanubeBulkEditRequest } from "./tiendanube-bulk-edit.model";

export interface TiendanubeBulkEditRepository {
  getCategorySummary(categoryId: number): Promise<TiendanubeBulkEditCategorySummary>;
  preview(request: TiendanubeBulkEditRequest): Promise<TiendanubeBulkEditPreview>;
  getActive(): Promise<TiendanubeBulkEditJob | null>;
  createJob(snapshotId: string): Promise<TiendanubeBulkEditJob>;
  getJob(jobId: string): Promise<TiendanubeBulkEditJob>;
  getFailures(jobId: string): Promise<readonly TiendanubeBulkEditFailure[]>;
  retryFailures(jobId: string): Promise<TiendanubeBulkEditJob>;
}
