export type TiendanubeReplicationStatus =
  | "UNKNOWN"
  | "NOT_REPLICATED"
  | "PENDING"
  | "FAILED"
  | "COMPLETED";

export type TiendanubeReplicationAction = "created" | "updated";
export type ReplicationOptions = Readonly<{ priceMode: "KEEP_SOURCE" | "OVERRIDE"; price?: number; categoryId: string }>;
export type TiendanubeCategory = Readonly<{ id: string; name: string; path?: string }>;
export type TiendanubeStoreSummary = Readonly<{ planName: string }>;

export type TiendanubeReplicationState = Readonly<{
  sourceKey: string;
  status: TiendanubeReplicationStatus;
  tiendanubeProductId: string | null;
}>;
