export type TiendanubeReplicationStatus =
  | "NOT_REPLICATED"
  | "PENDING"
  | "FAILED"
  | "COMPLETED";

export type TiendanubeReplicationAction = "created" | "updated";

export type TiendanubeReplicationState = Readonly<{
  sourceKey: string;
  status: TiendanubeReplicationStatus;
  tiendanubeProductId: string | null;
}>;
