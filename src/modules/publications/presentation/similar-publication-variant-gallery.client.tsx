"use client";

import { DeleteOutlined } from "@ant-design/icons";
import { Button, Image, Typography } from "antd";
import { useState } from "react";

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
  picturesByVariant: Readonly<Record<string, readonly SimilarPublicationPicture[]>>;
  onPicturesChange: (
    sourceReference: string,
    pictures: readonly SimilarPublicationPicture[],
  ) => void;
  uploadAction: UploadSimilarPublicationPictureAction;
  onUploadingChange: (uploading: boolean) => void;
}>;

const visibleThumbnails = 4;

export function SimilarPublicationVariantGallery({
  color,
  pictures,
  variants,
  picturesByVariant,
  onPicturesChange,
  uploadAction,
  onUploadingChange,
}: Props) {
  const [selectedKey, setSelectedKey] = useState<string | null>(
    pictures[0]?.key ?? null,
  );
  const selected =
    pictures.find(({ key }) => key === selectedKey) ?? pictures[0] ?? null;
  const colorPictures = pictures.map(({ picture }) => picture);

  return (
    <div className={styles.variantGallery}>
      {selected ? (
        <div className={styles.variantMainPicture}>
          <Image
            alt={`${color}, imagen principal`}
            height={220}
            src={selected.picture.secureUrl}
            width="100%"
          />
          <span className={styles.variantMainPictureBadge}>Principal</span>
        </div>
      ) : (
        <div className={styles.variantGalleryEmpty} role="img" aria-label={`Sin imágenes para ${color}`}>
          Sin imágenes específicas
        </div>
      )}

      <div className={styles.variantGalleryControls}>
        <div className={styles.variantThumbnails} aria-label={`Imágenes de ${color}`}>
          {pictures.slice(0, visibleThumbnails).map((picture, index) => (
            <div className={styles.variantThumbnail} key={picture.key}>
              <button
                aria-label={`Ver imagen ${index + 1} de ${color}`}
                className={picture.key === selected?.key ? styles.variantThumbnailSelected : ""}
                onClick={() => setSelectedKey(picture.key)}
                type="button"
              >
                <Image
                  alt=""
                  height={72}
                  preview={false}
                  src={picture.picture.secureUrl}
                  width={72}
                />
              </button>
              <Button
                aria-label={`Eliminar imagen ${index + 1} de ${color}`}
                className={styles.variantPictureRemove}
                icon={<DeleteOutlined />}
                onClick={() =>
                  removePicture(
                    picture,
                    variants,
                    picturesByVariant,
                    onPicturesChange,
                  )
                }
                size="small"
                type="text"
              />
            </div>
          ))}
          {pictures.length > visibleThumbnails ? (
            <span className={styles.variantPicturesMore}>
              +{pictures.length - visibleThumbnails}
            </span>
          ) : null}
        </div>

        {variants.length > 0 ? (
          <div className={styles.variantGalleryUpload}>
            <SimilarPublicationImages
              display="upload-only"
              onChange={(nextPictures) =>
                updateColorPictures(
                  variants,
                  nextPictures,
                  onPicturesChange,
                )
              }
              onUploadingChange={onUploadingChange}
              pictures={colorPictures}
              uploadAction={uploadAction}
              uploadButtonLabel="Agregar foto"
            />
            <Typography.Text type="secondary">
              La imagen se aplicará a todos los talles de {color}.
            </Typography.Text>
          </div>
        ) : null}
      </div>

      {pictures.length === 0 ? (
        <Typography.Text className={styles.variantGalleryHint} type="secondary">
          Cargá una imagen nueva para esta variante.
        </Typography.Text>
      ) : null}
    </div>
  );
}

function updateColorPictures(
  variants: readonly SimilarPublicationCardVariant[],
  pictures: readonly SimilarPublicationPicture[],
  onPicturesChange: Props["onPicturesChange"],
) {
  variants.forEach(({ sourceReference }) => {
    onPicturesChange(sourceReference, pictures);
  });
}

function removePicture(
  picture: SimilarPublicationVariantPicture,
  variants: readonly SimilarPublicationCardVariant[],
  picturesByVariant: Readonly<Record<string, readonly SimilarPublicationPicture[]>>,
  onPicturesChange: Props["onPicturesChange"],
) {
  variants.forEach(({ sourceReference }) => {
    const currentPictures = picturesByVariant[sourceReference] ?? [];

    onPicturesChange(
      sourceReference,
      currentPictures.filter(({ id }) => id !== picture.picture.id),
    );
  });
}
