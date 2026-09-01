"use client";

import { Form, Input, InputNumber, Space, Table, Typography } from "antd";
import type { TableColumnsType } from "antd";
import type {
  SimilarPublicationPicture,
  SimilarPublicationVariant,
} from "../domain/similar-publication.model";
import type { UploadSimilarPublicationPictureAction } from "./similar-publication-action.types";
import { SimilarPublicationImages } from "./similar-publication-images.client";

type Props = Readonly<{
  variants: readonly SimilarPublicationVariant[];
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
  picturesByVariant,
  onPicturesChange,
  uploadAction,
  onUploadingChange,
}: Props) {
  const columns: TableColumnsType<SimilarPublicationVariant> = [
    {
      title: "Atributos",
      key: "attributes",
      render: (_, variant) => variant.attributes.length > 0 ? (
        <Space orientation="vertical" size="small">
          {variant.attributes.map((attribute) => (
            <Form.Item
              key={attribute.id}
              label={attribute.name ?? attribute.id}
              name={["attributes", variant.sourceReference, attribute.id]}
              style={{ marginBottom: 4 }}
            >
              <Input
                aria-label={attribute.name ?? attribute.id}
                placeholder={`Nuevo ${attribute.name ?? attribute.id}`}
              />
            </Form.Item>
          ))}
        </Space>
      ) : "—",
      width: 260,
    },
    {
      title: "Precio",
      key: "price",
      render: (_, variant) => (
        <Form.Item
          name={["variants", variant.sourceReference, "price"]}
          rules={[{ required: true, type: "number", min: 0.01, message: "Ingresá un precio mayor a 0." }]}
          style={{ marginBottom: 0 }}
        >
          <InputNumber aria-label={`Precio ${variant.sourceReference}`} min={0.01} precision={2} prefix="$" />
        </Form.Item>
      ),
      width: 145,
    },
    {
      title: "Stock",
      key: "stock",
      render: (_, variant) => (
        <Form.Item
          name={["variants", variant.sourceReference, "stock"]}
          rules={[{ required: true, type: "number", min: 0, message: "Ingresá un stock válido." }]}
          style={{ marginBottom: 0 }}
        >
          <InputNumber aria-label={`Stock ${variant.sourceReference}`} min={0} precision={0} />
        </Form.Item>
      ),
      width: 100,
    },
    {
      title: "SKU nuevo",
      key: "sku",
      render: (_, variant) => (
        <Form.Item name={["variants", variant.sourceReference, "sku"]} style={{ marginBottom: 0 }}>
          <Input aria-label={`SKU nuevo ${variant.sourceReference}`} placeholder="Usá un SKU nuevo" />
        </Form.Item>
      ),
      width: 180,
    },
    {
      title: "Fotos",
      key: "pictures",
      render: (_, variant) => (
        <SimilarPublicationImages
          compact
          onChange={(pictures) => onPicturesChange(variant.sourceReference, pictures)}
          onUploadingChange={onUploadingChange}
          pictures={picturesByVariant[variant.sourceReference] ?? []}
          uploadAction={uploadAction}
        />
      ),
      width: 150,
    },
  ];

  return (
    <>
      <Typography.Paragraph type="secondary">
        Los atributos son genéricos y se pueden ajustar para cada variante.
        Los SKU e identificadores de producto comienzan vacíos.
      </Typography.Paragraph>
      <Table
        columns={columns}
        dataSource={[...variants]}
        pagination={false}
        rowKey="sourceReference"
        scroll={{ x: "max-content" }}
        size="small"
      />
    </>
  );
}
