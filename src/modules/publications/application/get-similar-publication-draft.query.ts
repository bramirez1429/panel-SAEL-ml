import type { SimilarPublicationRepository } from "../domain/similar-publication.repository";

export class GetSimilarPublicationDraftQuery {
  constructor(private readonly repository: SimilarPublicationRepository) {}

  execute(sourceKey: string) {
    return this.repository.getDraft(sourceKey);
  }
}
