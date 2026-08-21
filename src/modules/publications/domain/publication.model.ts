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
  permalink: string | null;
  price: Readonly<{
    from: number | null;
    to: number | null;
    currency: string | null;
  }> | null;
  stock: number;
  group: PublicationGroup;
}>;

export type PublicationAttribute = Readonly<{
  id: string;
  value: string | null;
}>;

export type PublicationVariant = Readonly<{
  id: string;
  itemId: string | null;
  userProductId: string | null;
  label: string | null;
  title: string | null;
  thumbnailUrl: string | null;
  status: string | null;
  price: Readonly<{
    amount: number;
    currency: string | null;
  }> | null;
  stock: number;
  sold: number;
  attributes: readonly PublicationAttribute[];
  permalink: string | null;
}>;

/**
 * Detalle propio del frontend. Conserva sólo datos reales del backend y
 * representa como null los vendidos que el parent no informa.
 */
export type PublicationDetail = Publication &
  Readonly<{
    sold: number | null;
    variants: readonly PublicationVariant[];
  }>;

export type PublicationsPage = Readonly<{
  publications: readonly Publication[];
  page: number;
  pageSize: number;
  count: number;
  total: number;
  totalPages: number;
}>;
