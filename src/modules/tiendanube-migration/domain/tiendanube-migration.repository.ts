import type { TiendanubeMigrationOutcome, TiendanubeMigrationProgress, TiendanubeMigrationResultsPage } from "./tiendanube-migration.model";

export interface TiendanubeMigrationRepository {
  start(): Promise<TiendanubeMigrationProgress>;
  getActive(): Promise<TiendanubeMigrationProgress | null>;
  getStatus(jobId: string): Promise<TiendanubeMigrationProgress>;
  getResults(jobId: string, outcome: TiendanubeMigrationOutcome, page: number, pageSize: number): Promise<TiendanubeMigrationResultsPage>;
}
