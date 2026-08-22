import type {
  PublicationDetail,
  PublicationsPage,
} from "./publication.model";

export type PublicationsRequest = Readonly<{
  pageSize: number;
  cursor: string | null;
}>;

/**
 * Puerto requerido por application para leer publicaciones.
 * El contrato expresa dominio y no conoce HTTP, endpoints ni DTO externos.
 */
export interface PublicationsRepository {
  getPublications(request: PublicationsRequest): Promise<PublicationsPage>;
  getById(id: string): Promise<PublicationDetail>;
}
