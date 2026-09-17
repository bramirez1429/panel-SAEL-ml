import type { PublicationVariant } from "../domain/publication.model";
import type {
  PublicationsRepository,
  PublicationVariantsRequest,
} from "../domain/publications.repository";

/** Carga exclusivamente las variantes solicitadas por una fila del listado. */
export class GetPublicationVariantsQuery {
  constructor(private readonly repository: PublicationsRepository) {}

  execute(
    request: PublicationVariantsRequest,
  ): Promise<readonly PublicationVariant[]> {
    return this.repository.getVariants(request);
  }
}
