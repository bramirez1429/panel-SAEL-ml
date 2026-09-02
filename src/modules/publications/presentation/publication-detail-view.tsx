import type { ReactNode } from "react";
import { Button, Card, Collapse, Descriptions, Image, Space, Tag, Typography, type DescriptionsProps } from "antd";

import type { PublicationDetail, SalesChannel } from "../domain/publication.model";
import { BackToPublicationsLink } from "./publication-back-link";
import { PublicationStatus } from "./publication-status";
import { PublicationVariantCard } from "./publication-variant-card";
import {
  createPublicationVariantCards,
  createPublicationVariantSummary,
} from "./publication-variant-card.model";
import { createPublicationVariantRows } from "./publication-variant-row";
import { PublicationVariantSummary } from "./publication-variant-summary";
import { PublicationVariantsTable } from "./publication-variants-table.client";
import styles from "./publication-detail-view.module.css";
import type { PublicationStatusAction, PublicationUpdateAction } from "./publication-variants-table.client";
import { PublicationStatusSwitch } from "./publication-status-switch.client";

export type PublicationDetailViewProps = Readonly<{
  publication: PublicationDetail;
  returnTo?: string;
  updateAction?: PublicationUpdateAction;
  statusAction?: PublicationStatusAction;
}>;

const channelLabels: Record<SalesChannel, string> = {
  MERCADO_LIBRE: "Mercado Libre",
};

const missingValue = <span title="Dato no disponible">—</span>;

export function PublicationDetailView({
  publication,
  returnTo,
  updateAction,
  statusAction,
}: PublicationDetailViewProps) {
  const isFamily = publication.group.type === "USER_PRODUCT";
  const rows = createPublicationVariantRows(publication);
  const visualVariants = createPublicationVariantCards(publication);
  const summary = createPublicationVariantSummary(visualVariants);

  return (
    <div className={styles.view}>
      <Space size="middle" wrap>
        <BackToPublicationsLink returnTo={returnTo} />
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
              {isFamily || !statusAction ? <PublicationStatus status={publication.status} /> : (
                <PublicationStatusSwitch
                  action={statusAction}
                  initialStatus={publication.status}
                  publicationId={publication.id}
                  target={{ type: "legacy", itemId: publication.id, variationId: null }}
                />
              )}
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

      <PublicationVariantSummary summary={summary} />

      <section aria-labelledby="visual-variants-title">
        <Typography.Title id="visual-variants-title" level={3}>
          Variantes por color
        </Typography.Title>
        <div className={styles.visualVariants}>
          {visualVariants.map((variant) => (
            <PublicationVariantCard key={variant.key} variant={variant} />
          ))}
        </div>
      </section>

      <section id="edicion-avanzada">
        <Collapse
          items={[
            {
              key: "advanced-editing",
              label: "Edición avanzada",
              children: (
                <div className={styles.advancedEditing}>
                  {isFamily ? <FamilySummary publication={publication} /> : null}
                  <PublicationVariantsTable
                    rows={rows}
                    statusAction={statusAction}
                    updateAction={updateAction}
                  />
                </div>
              ),
            },
          ]}
        />
      </section>
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
