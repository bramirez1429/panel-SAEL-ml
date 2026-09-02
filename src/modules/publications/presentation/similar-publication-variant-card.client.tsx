"use client";

import {
  Button,
  Card,
  Dropdown,
  Form,
  Input,
  InputNumber,
  Space,
  Table,
  Tag,
  Typography,
  type TableProps,
} from "antd";
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";

import type { SimilarPublicationPicture } from "../domain/similar-publication.model";
import type { UploadSimilarPublicationPictureAction } from "./similar-publication-action.types";
import type {
  SimilarPublicationCardVariant,
  SimilarPublicationVariantCard as SimilarPublicationVariantCardModel,
} from "./similar-publication-variant-card.model";
import { SimilarPublicationVariantGallery } from "./similar-publication-variant-gallery.client";
import styles from "./similar-publication-form.module.css";
import {
  availableVariantSizes,
  isAddedColorVariant,
  isAddedSizeVariant,
  type SimilarPublicationFormValues,
} from "./similar-publication-form.model";

type Props = Readonly<{
  card: SimilarPublicationVariantCardModel;
  formValues: SimilarPublicationFormValues;
  showPriceColumn: boolean;
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
  onRemoveVariant: (sourceReference: string) => void;
  onRemoveColor: (
    variants: readonly SimilarPublicationCardVariant["variant"][],
  ) => void;
}>;

export function SimilarPublicationVariantCard({
  card,
  formValues,
  showPriceColumn,
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

  const isNewColor = card.variants.some(({ sourceReference }) =>
    isAddedColorVariant(sourceReference),
  );

  const columns: NonNullable<
    TableProps<SimilarPublicationCardVariant>["columns"]
  > = [
    {
      title: "Talle",
      key: "size",
      width: 100,
      render: (_, variant) => (
        <Typography.Text strong>
          {variant.size ?? "Sin talle"}
        </Typography.Text>
      ),
    },
    {
      title: "Stock",
      key: "stock",
      width: 120,
      render: (_, variant) => (
        <Form.Item
          name={["variants", variant.sourceReference, "stock"]}
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
            aria-label={"Stock " + variant.sourceReference}
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
          name={["variants", variant.sourceReference, "sku"]}
          style={{ marginBottom: 0 }}
        >
          <Input
            aria-label={"SKU nuevo " + variant.sourceReference}
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
          name={["variants", variant.sourceReference, "price"]}
          rules={[
            {
              required: true,
              type: "number",
              min: 0.01,
              message: "Ingresá un precio mayor a 0.",
            },
          ]}
          style={{ marginBottom: 0 }}
        >
          <InputNumber
            aria-label={"Precio " + variant.sourceReference}
            min={0.01}
            precision={2}
            prefix="$"
            style={{ width: "100%" }}
          />
        </Form.Item>
      ),
    });
  }

  if (
    card.variants.some(({ sourceReference }) =>
      isAddedSizeVariant(sourceReference),
    )
  ) {
    columns.push({
      title: "Acción",
      key: "remove",
      width: 72,
      align: "center",
      render: (_, variant) =>
        isAddedSizeVariant(variant.sourceReference) ? (
          <Button
            aria-label={"Eliminar talle " + (variant.size ?? "agregado")}
            danger
            icon={<DeleteOutlined />}
            onClick={() => onRemoveVariant(variant.sourceReference)}
            type="text"
          />
        ) : null,
    });
  }

  return (
    <Card
      className={styles.variantCard}
      extra={
        <Space size="small">
          {card.complete ? (
            <Tag color="success">✓ Completa</Tag>
          ) : (
            <Tag color="warning">⚠ Revisar</Tag>
          )}

          {isNewColor ? (
            <Button
              danger
              onClick={() =>
                onRemoveColor(
                  card.variants.map(({ variant }) => variant),
                )
              }
              size="small"
            >
              Eliminar color
            </Button>
          ) : null}
        </Space>
      }
      title={
        <span className={styles.variantCardTitle}>
          {color}
        </span>
      }
    >
      <Typography.Text className={styles.variantSectionLabel}>
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
        variant.variant.attributes.map((attribute) => (
          <Form.Item
            hidden
            key={variant.sourceReference + ":" + attribute.id}
            name={[
              "attributes",
              variant.sourceReference,
              attribute.id,
            ]}
          >
            <Input aria-label={attribute.name ?? attribute.id} />
          </Form.Item>
        )),
      )}

      <div className={styles.variantTable}>
        <Typography.Text className={styles.variantSectionLabel}>
          Talles y stock
        </Typography.Text>

        <Table<SimilarPublicationCardVariant>
          columns={columns}
          dataSource={[...card.variants]}
          pagination={false}
          rowKey="sourceReference"
          scroll={{ x: showPriceColumn ? 760 : 580 }}
          size="small"
        />

        {availableSizes.length > 0 ? (
          <Dropdown
            menu={{
              items: availableSizes.map((size) => ({
                key: size,
                label: "Talle " + size,
              })),
              onClick: ({ key }) =>
                onAddSize(
                  card.variants.map(({ variant }) => variant),
                  key,
                ),
            }}
            trigger={["click"]}
          >
            <Button
              className={styles.addVariantSize}
              icon={<PlusOutlined />}
              type="dashed"
            >
              Agregar talle
            </Button>
          </Dropdown>
        ) : null}
      </div>

      <div className={styles.variantStockTotal}>
        <Typography.Text type="secondary">
          Stock total
        </Typography.Text>
        <Typography.Text strong>
          {card.stockTotal === null ? "—" : card.stockTotal + " u"}
        </Typography.Text>
      </div>
    </Card>
  );
}
