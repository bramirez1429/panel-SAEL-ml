"use client";

import { PlusOutlined } from "@ant-design/icons";
import {
  Button,
  Select,
  Typography,
} from "antd";
import { useState } from "react";

import type {
  SimilarPublicationAttributeOption,
  SimilarPublicationPicture,
  SimilarPublicationVariant,
} from "../domain/similar-publication.model";
import type { UploadSimilarPublicationPictureAction } from "./similar-publication-action.types";
import {
  availableVariantColors,
  type SimilarPublicationFormValues,
} from "./similar-publication-form.model";
import styles from "./similar-publication-form.module.css";
import { SimilarPublicationVariantCard } from "./similar-publication-variant-card.client";
import { createSimilarPublicationVariantCards } from "./similar-publication-variant-card.model";

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
  onRemoveVariant: (
    sourceReference: string,
  ) => void;
  onAddColor: (
    option: SimilarPublicationAttributeOption,
  ) => void;
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
  const [colorSearch, setColorSearch] =
    useState("");

  const [selectedColor, setSelectedColor] =
    useState<string | undefined>();

  const cards =
    createSimilarPublicationVariantCards(
      variants,
      formValues,
      picturesByVariant,
      commonPictures,
    );

  const availableColors =
    availableVariantColors(
      variants,
      formValues,
    );

  const existingColors = cards
    .map(({ color }) => color?.trim())
    .filter(
      (color): color is string =>
        Boolean(color),
    );

  const normalizedExisting = new Set(
    existingColors.map((color) =>
      color.toLocaleUpperCase("es-AR"),
    ),
  );

  const customColor = colorSearch.trim();

  const customAlreadyExists =
    customColor.length > 0 &&
    normalizedExisting.has(
      customColor.toLocaleUpperCase("es-AR"),
    );

  const addCustomColor = () => {
    if (
      !customColor ||
      customAlreadyExists
    ) {
      return;
    }

    onAddColor({
      id: null,
      name: customColor,
      colorHex: null,
    });

    setColorSearch("");
    setSelectedColor(undefined);
  };

  return (
    <>
      <div className={styles.colorManager}>
        <div>
          <Typography.Title level={5}>
            Agregar color
          </Typography.Title>

          <Typography.Text type="secondary">
            Buscá un color permitido por Mercado Libre
            o escribí uno nuevo.
          </Typography.Text>
        </div>

        <div className={styles.colorSearch}>
          <Select
            allowClear
            filterOption={(input, option) =>
              String(option?.label ?? "")
                .toLocaleLowerCase("es-AR")
                .includes(
                  input
                    .trim()
                    .toLocaleLowerCase("es-AR"),
                )
            }
            notFoundContent={
              customColor ? (
                customAlreadyExists ? (
                  <Typography.Text type="secondary">
                    Ese color ya está agregado.
                  </Typography.Text>
                ) : (
                  <Button
                    icon={<PlusOutlined />}
                    onMouseDown={(event) =>
                      event.preventDefault()
                    }
                    onClick={addCustomColor}
                    type="text"
                  >
                    Agregar "{customColor}"
                  </Button>
                )
              ) : (
                <Typography.Text type="secondary">
                  Escribí para buscar un color.
                </Typography.Text>
              )
            }
            onChange={(value) => {
              if (value === undefined) {
                setSelectedColor(undefined);
                return;
              }

              const option =
                availableColors[
                  Number(value)
                ];

              if (option) {
                onAddColor(option);
              }

              setSelectedColor(undefined);
              setColorSearch("");
            }}
            onSearch={setColorSearch}
            optionFilterProp="label"
            options={availableColors.map(
              (option, index) => ({
                value: String(index),
                label:
                  option.name ??
                  option.id ??
                  "Color",
              }),
            )}
            placeholder="Buscar o agregar color..."
            searchValue={colorSearch}
            showSearch
            value={selectedColor}
          />
        </div>

        {existingColors.length > 0 ? (
          <Typography.Text type="secondary">
            Colores actuales:{" "}
            {existingColors.join(", ")}
          </Typography.Text>
        ) : null}
      </div>

      <Typography.Paragraph type="secondary">
        Cada color tiene sus propias fotos,
        talles, stock y SKU.
      </Typography.Paragraph>

      <div className={styles.variantCards}>
        {cards.map((card) => (
          <SimilarPublicationVariantCard
            canRemoveColor={
              cards.length > 1
            }
            card={card}
            formValues={formValues}
            key={card.key}
            onAddSize={onAddSize}
            onPicturesChange={
              onPicturesChange
            }
            onRemoveColor={
              onRemoveColor
            }
            onRemoveVariant={
              onRemoveVariant
            }
            onUploadingChange={
              onUploadingChange
            }
            picturesByVariant={
              picturesByVariant
            }
            showPriceColumn={
              showPriceColumn
            }
            uploadAction={uploadAction}
          />
        ))}
      </div>
    </>
  );
}
