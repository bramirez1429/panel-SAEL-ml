import type { SimilarPublicationRepository } from "../domain/similar-publication.repository";

export class UploadSimilarPublicationPictureCommand {
  constructor(private readonly repository: SimilarPublicationRepository) {}

  execute(file: File) {
    return this.repository.uploadPicture(file);
  }
}
