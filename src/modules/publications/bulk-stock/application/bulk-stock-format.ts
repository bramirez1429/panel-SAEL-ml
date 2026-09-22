import type { BulkStockPublicationType } from "../domain/bulk-stock.model";

export const PUBLICATION_FORMAT_LABELS: Readonly<Record<BulkStockPublicationType, string>> = {
  LEGACY: "Formato anterior",
  USER_PRODUCT: "Formato actual",
};

export function getPublicationFormatLabel(model: BulkStockPublicationType): string {
  return PUBLICATION_FORMAT_LABELS[model];
}
