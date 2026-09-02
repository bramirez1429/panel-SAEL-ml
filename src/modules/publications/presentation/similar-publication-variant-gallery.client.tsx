"use client";

import { Typography } from "antd";

import type { SimilarPublicationPicture } from "../domain/similar-publication.model";
import type { UploadSimilarPublicationPictureAction } from "./similar-publication-action.types";
import type {
  SimilarPublicationCardVariant,
  SimilarPublicationVariantPicture,
} from "./similar-publication-variant-card.model";
import { SimilarPublicationImages } from "./similar-publication-images.client";
import styles from "./similar-publication-form.module.css";

type Props = Readonly<{
  color: string;
  pictures: readonly SimilarPublicationVariantPicture[];
  variants: readonly SimilarPublicationCardVariant[];
  picturesByVariant: Readonly<
    Record<string, readonly SimilarPublicationPicture[]>
  >;
  onPicturesChange: (
    sourceReference: string,
    pictures: readonly SimilarPublicationPicture[],
  ) => void;
  uploadAction: UploadSimilarPublicationPictureAction;
  onUploadingChange: (uploading: boolean) => void;
}>;

export function SimilarPublicationVariantGallery({
  color,
  pictures,
  variants,
  onPicturesChange,
  uploadAction,
  onUploadingChange,
}: Props) {
  const colorPictures = pictures.map(({ picture }) => picture);

  const updateColorPictures = (
    nextPictures: readonly SimilarPublicationPicture[],
  ) => {
    variants.forEach(({ sourceReference }) => {
      onPicturesChange(sourceReference, nextPictures);
    });
  };

  return (
    <div className={styles.variantGallery}>
      <SimilarPublicationImages
        display="picture-card"
        onChange={updateColorPictures}
        onUploadingChange={onUploadingChange}
        pictures={colorPictures}
        uploadAction={uploadAction}
        uploadButtonLabel="Agregar"
      />

      <Typography.Text type="secondary">
        {colorPictures.length}{" "}
        {colorPictures.length === 1 ? "foto" : "fotos"} · JPG o PNG · máximo
        10 MB por imagen · se aplican a todos los talles de {color}.
      </Typography.Text>
    </div>
  );
}
