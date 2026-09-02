"use client";

import { Image } from "antd";
import { useState } from "react";

import type { PublicationPicture } from "../domain/publication.model";
import styles from "./publication-detail-view.module.css";

type Props = Readonly<{
  label: string;
  pictures: readonly PublicationPicture[];
}>;

const visibleThumbnails = 4;

export function PublicationVariantGallery({ label, pictures }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(
    pictures[0]?.id ?? null,
  );
  const selected =
    pictures.find((picture) => picture.id === selectedId) ?? pictures[0] ?? null;

  if (!selected) {
    return (
      <div className={styles.galleryEmpty} role="img" aria-label={`Sin imágenes para ${label}`}>
        Sin imágenes
      </div>
    );
  }

  const thumbnails = pictures.slice(0, visibleThumbnails);
  const remaining = Math.max(0, pictures.length - thumbnails.length);

  return (
    <div className={styles.gallery}>
      <div className={styles.mainPicture}>
        <Image
          alt={`${label}, imagen principal`}
          height={210}
          src={selected.url}
          width="100%"
        />
        <span className={styles.mainPictureBadge}>Principal</span>
      </div>
      <div className={styles.thumbnails} aria-label={`Imágenes de ${label}`}>
        {thumbnails.map((picture, index) => (
          <button
            aria-label={`Ver imagen ${index + 1} de ${label}`}
            className={`${styles.thumbnailButton} ${picture.id === selected.id ? styles.thumbnailSelected : ""}`}
            key={picture.id}
            onClick={() => setSelectedId(picture.id)}
            type="button"
          >
            <Image
              alt=""
              height={72}
              preview={false}
              src={picture.url}
              width={72}
            />
          </button>
        ))}
        {remaining > 0 ? (
          <span className={styles.morePictures}>+{remaining}</span>
        ) : null}
      </div>
    </div>
  );
}
