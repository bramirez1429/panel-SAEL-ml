/**
 * Modelos propios del frontend para publicaciones.
 * No exponen nombres de transporte ni dependen de frameworks o proveedores externos.
 */
export type PublicationType = "LEGACY" | "USER_PRODUCT";

// El dominio reserva el canal futuro; la infraestructura actual sólo mapea Mercado Libre.
export type PublicationChannel = "MERCADO_LIBRE" | "TIENDANUBE";

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
  channel: PublicationChannel;
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
