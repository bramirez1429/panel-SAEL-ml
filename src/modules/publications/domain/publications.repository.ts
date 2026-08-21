import type { PublicationsPage } from "./publication.model";

/**
 * Puerto requerido por application para leer publicaciones.
 * El contrato expresa dominio y no conoce HTTP, endpoints ni DTO externos.
 */
export interface PublicationsRepository {
  getPublications(): Promise<PublicationsPage>;
}
