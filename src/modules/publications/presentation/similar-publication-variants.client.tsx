"use client";

import { Typography } from "antd";

import type {
  SimilarPublicationPicture,
  SimilarPublicationVariant,
} from "../domain/similar-publication.model";
import type { UploadSimilarPublicationPictureAction } from "./similar-publication-action.types";
import {
  createSimilarPublicationVariantCards,
  createSimilarPublicationVariantSummary,
} from "./similar-publication-variant-card.model";
import { SimilarPublicationVariantCard } from "./similar-publication-variant-card.client";
import type { SimilarPublicationFormValues } from "./similar-publication-form.model";
import { SimilarPublicationSummary } from "./similar-publication-summary";
import styles from "./similar-publication-form.module.css";

type Props = Readonly<{
  variants: readonly SimilarPublicationVariant[];
  formValues: SimilarPublicationFormValues;
  commonPictures: readonly SimilarPublicationPicture[];
  showPriceColumn?: boolean;
  picturesByVariant: Readonly<Record<string, readonly SimilarPublicationPicture[]>>;
  onPicturesChange: (
    sourceReference: string,
    pictures: readonly SimilarPublicationPicture[],
  ) => void;
  uploadAction: UploadSimilarPublicationPictureAction;
  onUploadingChange: (uploading: boolean) => void;
}>;

export function SimilarPublicationVariants({
  variants,
  formValues,
  commonPictures,
  showPriceColumn = true,
  picturesByVariant,
  onPicturesChange,
  uploadAction,
  onUploadingChange,
}: Props) {
  const cards = createSimilarPublicationVariantCards(
    variants,
    formValues,
    picturesByVariant,
    commonPictures,
  );
  const summary = createSimilarPublicationVariantSummary(cards, commonPictures);

  return (
    <>
      <Typography.Paragraph type="secondary">
        Cada color tiene sus propias fotos, talles, stock y SKU.
      </Typography.Paragraph>
      <SimilarPublicationSummary summary={summary} />
      <div className={styles.variantCards}>
        {cards.map((card) => (
          <SimilarPublicationVariantCard
            card={card}
            key={card.key}
            onPicturesChange={onPicturesChange}
            onUploadingChange={onUploadingChange}
            picturesByVariant={picturesByVariant}
            showPriceColumn={showPriceColumn}
            uploadAction={uploadAction}
          />
        ))}
      </div>
    </>
  );
}
