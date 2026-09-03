"use client";

import {
  DeleteOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import {
  Button,
  Card,
  Form,
  Select,
  Input,
  InputNumber,
  Space,
  Table,
  Tag,
  Typography,
  type TableProps,
} from "antd";

import type { SimilarPublicationPicture } from "../domain/similar-publication.model";
import type { UploadSimilarPublicationPictureAction } from "./similar-publication-action.types";
import {
  ADULT_SIZES,
  availableVariantSizes,
  GIRLS_SIZES,
  type SimilarPublicationFormValues,
} from "./similar-publication-form.model";
import styles from "./similar-publication-form.module.css";
import { SimilarPublicationVariantGallery } from "./similar-publication-variant-gallery.client";
import type {
  SimilarPublicationCardVariant,
  SimilarPublicationVariantCard as SimilarPublicationVariantCardModel,
} from "./similar-publication-variant-card.model";

type Props = Readonly<{
  card: SimilarPublicationVariantCardModel;
  formValues: SimilarPublicationFormValues;
  showPriceColumn: boolean;
  canRemoveColor: boolean;
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
    variants: readonly SimilarPublicationCardVariant["variant"][],
    size: string,
  ) => void;
  onRemoveVariant: (
    sourceReference: string,
  ) => void;
  onRemoveColor: (
    variants: readonly SimilarPublicationCardVariant["variant"][],
  ) => void;
}>;

export function SimilarPublicationVariantCard({
  card,
  formValues,
  showPriceColumn,
  canRemoveColor,
  picturesByVariant,
  onPicturesChange,
  uploadAction,
  onUploadingChange,
  onAddSize,
  onRemoveVariant,
  onRemoveColor,
}: Props) {
  const color = card.color ?? "Sin color";

  const availableSizes = availableVariantSizes(
    card.variants.map(({ variant }) => variant),
    formValues,
  );

  /*
   * Un color recién agregado mantiene una variante
   * placeholder interna para sostener fotos y metadata,
   * pero no debe mostrarse como "Sin talle".
   */
  const visibleVariants = card.variants.filter(
    ({ size }) => Boolean(size?.trim()),
  );

  const columns: NonNullable<
    TableProps<SimilarPublicationCardVariant>["columns"]
  > = [
    {
      title: "Talle",
      key: "size",
      width: 110,
      render: (_, variant) => (
        <Typography.Text strong>
          {variant.size ?? "Sin talle"}
        </Typography.Text>
      ),
    },
    {
      title: "Stock",
      key: "stock",
      width: 130,
      render: (_, variant) => (
        <Form.Item
          name={[
            "variants",
            variant.sourceReference,
            "stock",
          ]}
          rules={[
            {
              required: true,
              type: "number",
              min: 0,
              message: "Ingresá un stock válido.",
            },
          ]}
          style={{ marginBottom: 0 }}
        >
          <InputNumber
            aria-label={
              "Stock " + variant.sourceReference
            }
            min={0}
            precision={0}
            style={{ width: "100%" }}
          />
        </Form.Item>
      ),
    },
    {
      title: "SKU",
      key: "sku",
      width: 280,
      render: (_, variant) => (
        <Form.Item
          name={[
            "variants",
            variant.sourceReference,
            "sku",
          ]}
          style={{ marginBottom: 0 }}
        >
          <Input
            aria-label={
              "SKU nuevo " +
              variant.sourceReference
            }
            placeholder="SKU nuevo"
          />
        </Form.Item>
      ),
    },
  ];

  if (showPriceColumn) {
    columns.push({
      title: "Precio",
      key: "price",
      width: 170,
      render: (_, variant) => (
        <Form.Item
          name={[
            "variants",
            variant.sourceReference,
            "price",
          ]}
          rules={[
            {
              required: true,
              type: "number",
              min: 0.01,
              message:
                "Ingresá un precio mayor a 0.",
            },
          ]}
          style={{ marginBottom: 0 }}
        >
          <InputNumber
            aria-label={
              "Precio " +
              variant.sourceReference
            }
            min={0.01}
            precision={2}
            prefix="$"
            style={{ width: "100%" }}
          />
        </Form.Item>
      ),
    });
  }

  /*
   * Si hay más de un talle, cualquiera puede quitarse.
   * Incluso un talle heredado de la publicación original.
   */
  if (visibleVariants.length > 1) {
    columns.push({
      title: "",
      key: "remove",
      width: 64,
      align: "center",
      render: (_, variant) => (
        <Button
          aria-label={
            "Eliminar talle " +
            (variant.size ?? "sin talle")
          }
          danger
          icon={<DeleteOutlined />}
          onClick={() =>
            onRemoveVariant(
              variant.sourceReference,
            )
          }
          type="text"
        />
      ),
    });
  }

  return (
    <Card
      className={styles.variantCard}
      extra={
        <Space size="small">
          {card.complete ? (
            <Tag color="success">
              ✓ Completa
            </Tag>
          ) : (
            <Tag color="warning">
              ⚠ Revisar
            </Tag>
          )}

          {canRemoveColor ? (
            <Button
              danger
              icon={<DeleteOutlined />}
              onClick={() =>
                onRemoveColor(
                  card.variants.map(
                    ({ variant }) => variant,
                  ),
                )
              }
              size="small"
              type="text"
            >
              Eliminar color
            </Button>
          ) : null}
        </Space>
      }
      title={
        <span
          className={styles.variantCardTitle}
        >
          {color}
        </span>
      }
    >
      <Typography.Text
        className={styles.variantSectionLabel}
      >
        Fotos de {color}
      </Typography.Text>

      <SimilarPublicationVariantGallery
        color={color}
        onPicturesChange={onPicturesChange}
        onUploadingChange={onUploadingChange}
        pictures={card.pictures}
        picturesByVariant={picturesByVariant}
        uploadAction={uploadAction}
        variants={card.variants}
      />

      {card.variants.flatMap((variant) =>
        variant.variant.attributes.map(
          (attribute) => (
            <Form.Item
              hidden
              key={
                variant.sourceReference +
                ":" +
                attribute.id
              }
              name={[
                "attributes",
                variant.sourceReference,
                attribute.id,
              ]}
            >
              <Input
                aria-label={
                  attribute.name ??
                  attribute.id
                }
              />
            </Form.Item>
          ),
        ),
      )}

      <div className={styles.variantTable}>
        <Typography.Text
          className={styles.variantSectionLabel}
        >
          Talles, stock y SKU
        </Typography.Text>

        <Table<SimilarPublicationCardVariant>
          columns={columns}
          dataSource={[...visibleVariants]}
          locale={{
            emptyText:
              "Agregá un talle para comenzar.",
          }}
          pagination={false}
          rowKey="sourceReference"
          scroll={{
            x: showPriceColumn ? 760 : 580,
          }}
          size="small"
        />

        {availableSizes.length > 0 ? (
          <Select
            aria-label="Agregar talle"
            className={
              styles.addVariantSizeSelect
            }
            onChange={(size) => {
              if (!size) return;

              onAddSize(
                card.variants.map(
                  ({ variant }) =>
                    variant,
                ),
                size,
              );
            }}
            options={[
              {
                label: "Adultos",
                options: ADULT_SIZES
                  .filter((size) =>
                    availableSizes.includes(
                      size,
                    ),
                  )
                  .map((size) => ({
                    label: size,
                    value: size,
                  })),
              },
              {
                label: "Niñas",
                options: GIRLS_SIZES
                  .filter((size) =>
                    availableSizes.includes(
                      size,
                    ),
                  )
                  .map((size) => ({
                    label: size,
                    value: size,
                  })),
              },
            ]}
            placeholder="Agregar talle..."
            showSearch
            value={undefined}
          />
        ) : null}
      </div>
    </Card>
  );
}
