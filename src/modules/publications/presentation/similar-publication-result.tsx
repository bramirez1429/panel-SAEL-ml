"use client";

import { Alert, Button, Card, List, Space, Tag, Typography } from "antd";
import type { SimilarPublicationCreationResult } from "../domain/similar-publication.model";

export type TiendanubePublishResult =
  | Readonly<{ status: "NOT_REQUESTED" }>
  | Readonly<{ status: "PUBLISHING" }>
  | Readonly<{ status: "SUCCESS" }>
  | Readonly<{ status: "ERROR"; message: string }>;

type Props = Readonly<{
  result: SimilarPublicationCreationResult;
  tiendanube: TiendanubePublishResult;
  returnTo: string;
  onRetryTiendanube: () => void;
}>;

export function SimilarPublicationResult({
  result,
  tiendanube,
  returnTo,
  onRetryTiendanube,
}: Props) {
  const created = result.items.filter(({ status }) => status === "CREATED");
  const failed = result.items.filter(({ status }) => status === "ERROR");

  return (
    <div>
      <Typography.Title level={2}>
        {result.status === "FAILED" ? "No se pudo crear la publicación" : "Publicación creada"}
      </Typography.Title>
      {result.status === "PARTIAL" ? (
        <Alert
          message="La publicación se creó parcialmente. Revisá cada variante."
          showIcon
          type="warning"
        />
      ) : null}
      {result.status === "FAILED" ? (
        <Alert message="Mercado Libre no pudo crear la publicación." showIcon type="error" />
      ) : null}

      <Card title="Mercado Libre" style={{ marginTop: 16 }}>
        <List
          dataSource={[...result.items]}
          renderItem={(item) => (
            <List.Item>
              <Space orientation="vertical" size={2}>
                <Space>
                  <Tag color={item.status === "CREATED" ? "green" : "red"}>
                    {item.status === "CREATED" ? "Creada" : "Error"}
                  </Tag>
                  <span>{item.itemId ?? item.variantKey}</span>
                </Space>
                {item.error ? (
                  <Typography.Text type="danger">
                    {item.error.message}
                    {item.error.errorCode ? ` (${item.error.errorCode})` : ""}
                  </Typography.Text>
                ) : null}
              </Space>
            </List.Item>
          )}
        />
        {created[0]?.itemId ? (
          <Button href={mercadoLibreItemUrl(created[0].itemId)} target="_blank">
            Ver en Mercado Libre
          </Button>
        ) : null}
      </Card>

      {tiendanube.status !== "NOT_REQUESTED" ? (
        <Card title="Tienda Nube" style={{ marginTop: 16 }}>
          {tiendanube.status === "PUBLISHING" ? <span>Replicando en Tienda Nube...</span> : null}
          {tiendanube.status === "SUCCESS" ? <Tag color="green">Producto creado</Tag> : null}
          {tiendanube.status === "ERROR" ? (
            <Space orientation="vertical">
              <Alert message={tiendanube.message} showIcon type="error" />
              <Button onClick={onRetryTiendanube}>Reintentar Tienda Nube</Button>
            </Space>
          ) : null}
        </Card>
      ) : null}

      <Space style={{ marginTop: 20 }}>
        <Button href={returnTo} type="primary">Volver a publicaciones</Button>
        {failed.length > 0 ? (
          <Typography.Text type="secondary">
            Las variantes exitosas no se volverán a crear automáticamente.
          </Typography.Text>
        ) : null}
      </Space>
    </div>
  );
}

function mercadoLibreItemUrl(itemId: string): string {
  return `https://articulo.mercadolibre.com.ar/${itemId.replace(/^MLA/u, "MLA-")}`;
}
