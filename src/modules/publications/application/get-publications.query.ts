import type { PublicationsPage } from "../domain/publication.model";
import type { PublicationsRepository } from "../domain/publications.repository";

/**
 * Caso de uso de lectura. Coordina el repositorio sin conocer su implementación
 * HTTP ni detalles del proveedor de origen.
 */
export class GetPublicationsQuery {
  constructor(private readonly repository: PublicationsRepository) {}

  execute(): Promise<PublicationsPage> {
    return this.repository.getPublications();
  }
}
