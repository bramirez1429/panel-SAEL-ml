export type TiendanubeReplicationStatus =
  | "UNKNOWN"
  | "NOT_REPLICATED"
  | "PENDING"
  | "FAILED"
  | "COMPLETED";

export type TiendanubeReplicationAction = "created" | "updated";
export type ReplicationOptions = Readonly<{ priceMode: "KEEP_SOURCE" | "OVERRIDE"; price?: number; tagMode: "KEEP_SOURCE" | "OVERRIDE"; tags?: readonly string[]; categoryId: number }>;
export type TiendanubeCategory = Readonly<{ id: number; name: string; parentId: number | null }>;

export type TiendanubeReplicationState = Readonly<{
  sourceKey: string;
  status: TiendanubeReplicationStatus;
  tiendanubeProductId: string | null;
}>;
