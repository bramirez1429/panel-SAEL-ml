"use client";

import { DeleteOutlined } from "@ant-design/icons";
import { Button, Image, Select, Typography } from "antd";
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
  const [targetReference, setTargetReference] = useState<string | null>(
    variants[0]?.sourceReference ?? null,
  );
  const selected =
    pictures.find(({ key }) => key === selectedKey) ?? pictures[0] ?? null;
  const target = variants.find(
    ({ sourceReference }) => sourceReference === targetReference,
  ) ?? variants[0] ?? null;

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
                onClick={() => removePicture(picture, picturesByVariant, onPicturesChange)}
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

        {target ? (
          <div className={styles.variantGalleryUpload}>
            {variants.length > 1 ? (
              <Select
                aria-label={`Asignar fotos de ${color} a talle`}
                onChange={setTargetReference}
                options={variants.map((variant) => ({
                  label: variant.size ? `Talle ${variant.size}` : "Variante sin talle",
                  value: variant.sourceReference,
                }))}
                value={target.sourceReference}
              />
            ) : null}
            <SimilarPublicationImages
              display="upload-only"
              onChange={(nextPictures) =>
                onPicturesChange(target.sourceReference, nextPictures)
              }
              onUploadingChange={onUploadingChange}
              pictures={picturesByVariant[target.sourceReference] ?? []}
              uploadAction={uploadAction}
              uploadButtonLabel="Agregar foto"
            />
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

function removePicture(
  picture: SimilarPublicationVariantPicture,
  picturesByVariant: Readonly<Record<string, readonly SimilarPublicationPicture[]>>,
  onPicturesChange: Props["onPicturesChange"],
) {
  const ownerPictures = picturesByVariant[picture.sourceReference] ?? [];
  onPicturesChange(
    picture.sourceReference,
    ownerPictures.filter(({ id }) => id !== picture.picture.id),
  );
}
