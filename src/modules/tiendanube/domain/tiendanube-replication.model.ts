export type TiendanubeReplicationStatus =
  | "UNKNOWN"
  | "NOT_REPLICATED"
  | "PENDING"
  | "FAILED"
  | "COMPLETED";

export type TiendanubeReplicationAction = "created" | "updated";
export type ReplicationOptions = Readonly<{ categoryId: string }>;
export type TiendanubeCategory = Readonly<{ id: string; name: string; parentId: number | null }>;

export type TiendanubeReplicationState = Readonly<{
  sourceKey: string;
  status: TiendanubeReplicationStatus;
  tiendanubeProductId: string | null;
}>;
