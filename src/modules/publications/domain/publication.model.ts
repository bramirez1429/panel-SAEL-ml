/**
 * Modelos propios del frontend para publicaciones.
 * No exponen nombres de transporte ni dependen de frameworks o proveedores externos.
 */
export type PublicationType = "LEGACY" | "USER_PRODUCT";

export type SalesChannel = "MERCADO_LIBRE";

export type PublicationGroup = Readonly<{
  key: string;
  type: PublicationType;
  familyId: string | null;
  itemId: string | null;
  childrenCount: number;
}>;

export type Publication = Readonly<{
  id: string;
  title: string;
  channel: SalesChannel;
  status: string | null;
  thumbnailUrl: string | null;
  group: PublicationGroup;
}>;

export type PublicationsPage = Readonly<{
  publications: readonly Publication[];
  page: number;
  pageSize: number;
  count: number;
  total: number;
  totalPages: number;
}>;
