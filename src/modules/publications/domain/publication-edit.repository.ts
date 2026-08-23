export type PublicationEditTarget =
  | Readonly<{ type: "family"; familyId: string; itemId: string }>
  | Readonly<{ type: "legacy"; itemId: string; variationId: number | null }>;
export type PublicationEditStatus = "active" | "paused";

export interface PublicationEditRepository {
  updatePrice(target: PublicationEditTarget, price: number): Promise<void>;
  updateStock(target: PublicationEditTarget, quantity: number): Promise<void>;
  updateSku(target: PublicationEditTarget, sku: string): Promise<void>;
  updateStatus(target: PublicationEditTarget, status: PublicationEditStatus): Promise<void>;
}
