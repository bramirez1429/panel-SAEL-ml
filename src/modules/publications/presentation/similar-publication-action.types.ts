import type {
  SimilarPublicationCreateInput,
  SimilarPublicationCreationResult,
  SimilarPublicationPicture,
} from "../domain/similar-publication.model";

export type CreateSimilarPublicationAction = (
  input: SimilarPublicationCreateInput,
) => Promise<
  | Readonly<{ ok: true; result: SimilarPublicationCreationResult }>
  | Readonly<{ ok: false; message: string }>
>;

export type UploadSimilarPublicationPictureAction = (
  formData: FormData,
) => Promise<
  | Readonly<{ ok: true; picture: SimilarPublicationPicture }>
  | Readonly<{ ok: false; message: string }>
>;
