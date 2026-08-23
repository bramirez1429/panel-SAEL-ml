import type { ReactNode } from "react";
import { Button, Card, Descriptions, Image, Space, Tag, type DescriptionsProps } from "antd";

import type { PublicationDetail, SalesChannel } from "../domain/publication.model";
import { BackToPublicationsLink } from "./publication-back-link";
import { PublicationStatus } from "./publication-status";
import { createPublicationVariantRows } from "./publication-variant-row";
import { PublicationVariantsTable } from "./publication-variants-table.client";
import styles from "./publication-detail-view.module.css";

export type PublicationDetailViewProps = Readonly<{
  publication: PublicationDetail;
}>;

const channelLabels: Record<SalesChannel, string> = {
  MERCADO_LIBRE: "Mercado Libre",
};

const missingValue = <span title="Dato no disponible">—</span>;

export function PublicationDetailView({ publication }: PublicationDetailViewProps) {
  const isFamily = publication.group.type === "USER_PRODUCT";
  const rows = createPublicationVariantRows(publication);

  return (
    <div className={styles.view}>
      <Space size="middle" wrap>
        <BackToPublicationsLink />
        {publication.permalink ? (
          <Button href={publication.permalink} rel="noreferrer" target="_blank" type="primary">
            Ver en Mercado Libre
          </Button>
        ) : null}
      </Space>

      <Card>
        <div className={styles.productHeader}>
          {publication.thumbnailUrl ? (
            <Image
              alt={`Imagen de ${publication.title}`}
              className={styles.thumbnail}
              preview={false}
              src={publication.thumbnailUrl}
              width={128}
            />
          ) : null}
          <div className={styles.productHeading}>
            <Space size="small" wrap>
              <Tag color={isFamily ? "blue" : undefined}>
                {isFamily ? "Familia" : "Anterior"}
              </Tag>
              <PublicationStatus status={publication.status} />
            </Space>
            <h2>{publication.title}</h2>
          </div>
        </div>
        <Descriptions
          className={styles.descriptions}
          column={{ xs: 1, sm: 2, lg: 3 }}
          items={createPublicationDetails(publication)}
          layout="vertical"
          size="small"
        />
      </Card>

      <Card title={isFamily ? "Familia" : "Variaciones Anterior"}>
        {isFamily ? <FamilySummary publication={publication} /> : null}
        <PublicationVariantsTable rows={rows} />
      </Card>
    </div>
  );
}

function FamilySummary({ publication }: { publication: PublicationDetail }) {
  return (
    <Descriptions
      column={{ xs: 1, sm: 3 }}
      items={[
        { key: "familyId", label: "ID de familia", children: valueOrMissing(publication.group.familyId) },
        { key: "userProductId", label: "ID user product", children: valueOrMissing(publication.group.userProductId) },
        { key: "count", label: "Publicaciones", children: publication.group.childrenCount },
      ]}
      layout="vertical"
      size="small"
    />
  );
}

function createPublicationDetails(publication: PublicationDetail): DescriptionsProps["items"] {
  return [
    { key: "channel", label: "Canal", children: channelLabels[publication.channel] },
    { key: "price", label: "Precio", children: formatPublicationPrice(publication) },
    { key: "stock", label: "Stock", children: publication.stock },
    { key: "sold", label: "Vendidos", children: publication.sold === null ? missingValue : publication.sold },
    { key: "familyId", label: "ID de familia", children: valueOrMissing(publication.group.familyId) },
    { key: "itemId", label: "ID del ítem", children: valueOrMissing(publication.group.itemId) },
    { key: "externalKey", label: "Clave externa", children: publication.group.key },
    { key: "internalId", label: "ID interno", children: publication.id },
    ...(publication.group.type === "LEGACY"
      ? [{ key: "legacyDescription", label: "Descripción", children: "Publicación del modelo anterior de Mercado Libre." }]
      : []),
  ];
}

function valueOrMissing(value: string | null): ReactNode {
  return value ?? missingValue;
}

function formatPublicationPrice(publication: PublicationDetail): ReactNode {
  const from = publication.price?.from ?? null;
  const to = publication.price?.to ?? null;
  if (from === null && to === null) return missingValue;
  const currency = publication.price?.currency ?? null;
  if (from !== null && to !== null && from !== to) {
    return `${formatAmount(from, currency)} – ${formatAmount(to, currency)}`;
  }
  return formatAmount(from ?? to ?? 0, currency);
}

function formatAmount(amount: number, currency: string | null): string {
  const formatted = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 2 }).format(amount);
  return currency ? `${currency} ${formatted}` : formatted;
}
