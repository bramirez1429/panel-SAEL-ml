export type IntegrationStatus = "connected" | "not-connected" | "unknown";

export type MercadoLibreConnection = Readonly<{
  status: IntegrationStatus;
  sellerId: number | null;
}>;

export type TiendanubeConnection = Readonly<{
  status: IntegrationStatus;
  storeId: string | null;
}>;
