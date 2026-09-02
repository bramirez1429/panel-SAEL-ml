"use client";

import { Button, Dropdown, Typography } from "antd";
import { PlusOutlined } from "@ant-design/icons";

import type {
  SimilarPublicationAttributeOption,
  SimilarPublicationPicture,
  SimilarPublicationVariant,
} from "../domain/similar-publication.model";
import type { UploadSimilarPublicationPictureAction } from "./similar-publication-action.types";
import { createSimilarPublicationVariantCards } from "./similar-publication-variant-card.model";
import { SimilarPublicationVariantCard } from "./similar-publication-variant-card.client";
import {
  availableVariantColors,
  type SimilarPublicationFormValues,
} from "./similar-publication-form.model";
import styles from "./similar-publication-form.module.css";

type Props = Readonly<{
  variants: readonly SimilarPublicationVariant[];
  formValues: SimilarPublicationFormValues;
  commonPictures: readonly SimilarPublicationPicture[];
  showPriceColumn?: boolean;
  picturesByVariant: Readonly<
    Record<string, readonly SimilarPublicationPicture[]>
  >;
  onPicturesChange: (
    sourceReference: string,
    pictures: readonly SimilarPublicationPicture[],
  ) => void;
  uploadAction: UploadSimilarPublicationPictureAction;
  onUploadingChange: (uploading: boolean) => void;
  onAddSize: (
    variants: readonly SimilarPublicationVariant[],
    size: string,
  ) => void;
  onRemoveVariant: (sourceReference: string) => void;
  onAddColor: (option: SimilarPublicationAttributeOption) => void;
  onRemoveColor: (
    variants: readonly SimilarPublicationVariant[],
  ) => void;
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
  onAddSize,
  onRemoveVariant,
  onAddColor,
  onRemoveColor,
}: Props) {
  const cards = createSimilarPublicationVariantCards(
    variants,
    formValues,
    picturesByVariant,
    commonPictures,
  );

  const availableColors = availableVariantColors(
    variants,
    formValues,
  );

  return (
    <>
      <Typography.Paragraph type="secondary">
        Cada color tiene sus propias fotos, talles, stock y SKU.
      </Typography.Paragraph>

      <div className={styles.variantCards}>
        {cards.map((card) => (
          <SimilarPublicationVariantCard
            card={card}
            formValues={formValues}
            key={card.key}
            onAddSize={onAddSize}
            onPicturesChange={onPicturesChange}
            onRemoveColor={onRemoveColor}
            onRemoveVariant={onRemoveVariant}
            onUploadingChange={onUploadingChange}
            picturesByVariant={picturesByVariant}
            showPriceColumn={showPriceColumn}
            uploadAction={uploadAction}
          />
        ))}
      </div>

      <div className={styles.addColorAction}>
        <Dropdown
          disabled={availableColors.length === 0}
          menu={{
            items: availableColors.map((option, index) => ({
              key: String(index),
              label: option.name ?? option.id ?? "Color",
            })),
            onClick: ({ key }) => {
              const option = availableColors[Number(key)];
              if (option) onAddColor(option);
            },
          }}
          trigger={["click"]}
        >
          <Button
            disabled={availableColors.length === 0}
            icon={<PlusOutlined />}
            type="dashed"
          >
            Agregar color
          </Button>
        </Dropdown>

        {availableColors.length === 0 ? (
          <Typography.Text type="secondary">
            No hay más colores disponibles para esta categoría.
          </Typography.Text>
        ) : null}
      </div>
    </>
  );
}
