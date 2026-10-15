import type { TiendanubeMigrationOutcome, TiendanubeMigrationProgress, TiendanubeMigrationResultsPage } from "./tiendanube-migration.model";

export interface TiendanubeMigrationRepository {
  start(testLimit?: 1 | 5 | 10): Promise<TiendanubeMigrationProgress>;
  resumeOne(jobId: string, singleProduct?: boolean): Promise<TiendanubeMigrationProgress>;
  pause(jobId: string): Promise<TiendanubeMigrationProgress>;
  cancel(jobId: string): Promise<TiendanubeMigrationProgress>;
  getActive(): Promise<TiendanubeMigrationProgress | null>;
  getStatus(jobId: string): Promise<TiendanubeMigrationProgress>;
  getResults(jobId: string, outcome: TiendanubeMigrationOutcome, page: number, pageSize: number): Promise<TiendanubeMigrationResultsPage>;
}
