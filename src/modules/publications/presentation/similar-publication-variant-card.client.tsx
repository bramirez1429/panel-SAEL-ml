"use client";

import { Card, Form, Input, InputNumber, Space, Tag, Typography } from "antd";

import type { SimilarPublicationPicture } from "../domain/similar-publication.model";
import type { UploadSimilarPublicationPictureAction } from "./similar-publication-action.types";
import type { SimilarPublicationVariantCard as SimilarPublicationVariantCardModel } from "./similar-publication-variant-card.model";
import { SimilarPublicationVariantGallery } from "./similar-publication-variant-gallery.client";
import styles from "./similar-publication-form.module.css";

type Props = Readonly<{
  card: SimilarPublicationVariantCardModel;
  showPriceColumn: boolean;
  picturesByVariant: Readonly<Record<string, readonly SimilarPublicationPicture[]>>;
  onPicturesChange: (
    sourceReference: string,
    pictures: readonly SimilarPublicationPicture[],
  ) => void;
  uploadAction: UploadSimilarPublicationPictureAction;
  onUploadingChange: (uploading: boolean) => void;
}>;

export function SimilarPublicationVariantCard({
  card,
  showPriceColumn,
  picturesByVariant,
  onPicturesChange,
  uploadAction,
  onUploadingChange,
}: Props) {
  const color = card.color ?? "Variante sin color";

  return (
    <Card
      className={styles.variantCard}
      extra={
        card.complete ? (
          <Tag color="success">✓ Completa</Tag>
        ) : (
          <Tag color="warning">⚠ Revisar</Tag>
        )
      }
      title={<span className={styles.variantCardTitle}>{color}</span>}
    >
      <Typography.Text className={styles.variantSectionLabel}>
        Imágenes de {color}
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
      <Typography.Text className={styles.variantImageCount} type="secondary">
        {card.pictures.length} {card.pictures.length === 1 ? "imagen específica" : "imágenes específicas"}
        {card.commonPicturesCount > 0
          ? ` · ${card.commonPicturesCount} imágenes generales aplicables`
          : ""}
      </Typography.Text>

      <div className={styles.variantSizes}>
        <Typography.Text className={styles.variantSectionLabel}>Talles</Typography.Text>
        <Space size={[6, 8]} wrap>
          {card.variants.map((variant) => (
            <Tag className={styles.variantSizeTag} key={variant.sourceReference}>
              {variant.size ?? "Sin talle"} · {formatStock(variant.stock)}
            </Tag>
          ))}
        </Space>
      </div>

      <dl className={styles.variantFacts}>
        <Fact label="Stock total" value={card.stockTotal === null ? "—" : `${card.stockTotal} u`} />
        <Fact label="Variantes" value={String(card.variants.length)} />
      </dl>

      <div className={styles.variantEditors}>
        {card.variants.map((variant) => (
          <section className={styles.variantEditor} key={variant.sourceReference}>
            <Typography.Text strong>
              {variant.size ? `Talle ${variant.size}` : "Variante"}
            </Typography.Text>
            <div className={styles.variantEditorFields}>
              {variant.variant.attributes.map((attribute) => (
                <Form.Item
                  key={attribute.id}
                  label={attribute.name ?? attribute.id}
                  name={["attributes", variant.sourceReference, attribute.id]}
                  style={{ marginBottom: 0 }}
                >
                  <Input
                    aria-label={attribute.name ?? attribute.id}
                    placeholder={`Nuevo ${attribute.name ?? attribute.id}`}
                  />
                </Form.Item>
              ))}
              {showPriceColumn ? (
                <Form.Item
                  label="Precio"
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
                    aria-label={`Precio ${variant.sourceReference}`}
                    min={0.01}
                    precision={2}
                    prefix="$"
                    style={{ width: "100%" }}
                  />
                </Form.Item>
              ) : null}
              <Form.Item
                label="Stock"
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
                  aria-label={`Stock ${variant.sourceReference}`}
                  min={0}
                  precision={0}
                  style={{ width: "100%" }}
                />
              </Form.Item>
              <Form.Item
                label="SKU nuevo"
                name={["variants", variant.sourceReference, "sku"]}
                style={{ marginBottom: 0 }}
              >
                <Input
                  aria-label={`SKU nuevo ${variant.sourceReference}`}
                  placeholder="Usá un SKU nuevo"
                />
              </Form.Item>
            </div>
          </section>
        ))}
      </div>
    </Card>
  );
}

function Fact({ label, value }: Readonly<{ label: string; value: string }>) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function formatStock(stock: number | null): string {
  if (stock === null) return "Stock sin informar";
  if (stock === 0) return "Sin stock";
  return `${stock} u`;
}
