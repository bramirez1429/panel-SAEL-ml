import type {
  PublicationDetail,
  PublicationType,
  PublicationVariant,
  PublicationsPage,
} from "./publication.model";

export type PublicationsRequest = Readonly<{
  pageSize: number;
  cursor: string | null;
  search?: string;
}>;

export type PublicationVariantsRequest = Readonly<{
  publicationId: string;
  publicationType: PublicationType;
  familyId: string | null;
}>;

/**
 * Puerto requerido por application para leer publicaciones.
 * El contrato expresa dominio y no conoce HTTP, endpoints ni DTO externos.
 */
export interface PublicationsRepository {
  getPublications(request: PublicationsRequest): Promise<PublicationsPage>;
  getById(id: string): Promise<PublicationDetail>;
  getVariants(request: PublicationVariantsRequest): Promise<readonly PublicationVariant[]>;
}
