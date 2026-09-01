import type { SimilarPublicationCreateInput } from "../domain/similar-publication.model";
import type { SimilarPublicationRepository } from "../domain/similar-publication.repository";

export class CreateSimilarPublicationCommand {
  constructor(private readonly repository: SimilarPublicationRepository) {}

  execute(input: SimilarPublicationCreateInput) {
    return this.repository.create(input);
  }
}
