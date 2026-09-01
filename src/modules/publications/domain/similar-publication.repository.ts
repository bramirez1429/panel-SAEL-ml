import type {
  SimilarPublicationCreateInput,
  SimilarPublicationCreationResult,
  SimilarPublicationDraft,
  SimilarPublicationPicture,
} from "./similar-publication.model";

export interface SimilarPublicationRepository {
  getDraft(sourceKey: string): Promise<SimilarPublicationDraft>;
  uploadPicture(file: File): Promise<SimilarPublicationPicture>;
  create(input: SimilarPublicationCreateInput): Promise<SimilarPublicationCreationResult>;
}
