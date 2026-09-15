import type {
  RecentSalesResponse,
  SalesSyncResult,
  SaleVariantsResponse,
} from "./sales.model";

export interface SalesRepository {
  getRecent(hours?: number): Promise<RecentSalesResponse>;
  getVariants(saleId: string): Promise<SaleVariantsResponse>;
  sync(hours?: number): Promise<SalesSyncResult>;
}
