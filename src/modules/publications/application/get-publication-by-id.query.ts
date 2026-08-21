import type { PublicationDetail } from "../domain/publication.model";
import type { PublicationsRepository } from "../domain/publications.repository";

/**
 * Caso de uso de detalle. Depende del puerto de dominio y no conoce HTTP,
 * DTO, Zod ni el proveedor externo que origina los datos.
 */
export class GetPublicationByIdQuery {
  constructor(private readonly repository: PublicationsRepository) {}

  execute(id: string): Promise<PublicationDetail> {
    return this.repository.getById(id);
  }
}
