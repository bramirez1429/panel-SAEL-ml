import type { ReactNode } from "react";
import {
  Button,
  Card,
  Descriptions,
  Image,
  Space,
  Tag,
  type DescriptionsProps,
} from "antd";

import type {
  PublicationDetail,
  PublicationVariant,
  SalesChannel,
} from "../domain/publication.model";
import { BackToPublicationsLink } from "./publication-back-link";
import styles from "./publication-detail-view.module.css";

export type PublicationDetailViewProps = Readonly<{
  publication: PublicationDetail;
}>;

const channelLabels: Record<SalesChannel, string> = {
  MERCADO_LIBRE: "Mercado Libre",
};

const missingValue = <span title="Dato no disponible">—</span>;

export function PublicationDetailView({
  publication,
}: PublicationDetailViewProps) {
  const isFamily = publication.group.type === "USER_PRODUCT";
  const details = createPublicationDetails(publication);

  return (
    <div className={styles.view}>
      <Space size="middle" wrap>
        <BackToPublicationsLink />
        {publication.permalink ? (
          <Button
            href={publication.permalink}
            rel="noreferrer"
            target="_blank"
            type="primary"
          >
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
                {isFamily ? "Familia" : "Legacy"}
              </Tag>
              {renderStatus(publication.status)}
            </Space>
            <h2>{publication.title}</h2>
          </div>
        </div>

        <Descriptions
          className={styles.descriptions}
          column={{ xs: 1, sm: 2, lg: 3 }}
          items={details}
          layout="vertical"
          size="small"
        />
      </Card>

      <Card
        extra={<Tag>{publication.variants.length}</Tag>}
        title={
          isFamily ? "Familia → hijos y variantes" : "Variaciones Legacy"
        }
      >
        {publication.variants.length > 0 ? (
          <div className={styles.variants}>
            {publication.variants.map((variant) => (
              <VariantCard key={variant.id} variant={variant} />
            ))}
          </div>
        ) : (
          <p className={styles.emptyRelation}>
            El backend no informó {isFamily ? "ítems hijos" : "variaciones"}
            {" para esta publicación."}
          </p>
        )}
      </Card>
    </div>
  );
}

function VariantCard({ variant }: Readonly<{ variant: PublicationVariant }>) {
  const title = variant.title || variant.label || variant.itemId || variant.id;
  const items: DescriptionsProps["items"] = [
    { key: "itemId", label: "ID del ítem", children: valueOrMissing(variant.itemId) },
    {
      key: "userProductId",
      label: "ID de producto",
      children: valueOrMissing(variant.userProductId),
    },
    { key: "status", label: "Estado", children: renderStatus(variant.status) },
    { key: "price", label: "Precio", children: formatVariantPrice(variant) },
    { key: "stock", label: "Stock", children: variant.stock },
    { key: "sold", label: "Vendidos", children: variant.sold },
    {
      key: "attributes",
      label: "Atributos",
      children:
        variant.attributes.length > 0 ? (
          <Space size={[4, 8]} wrap>
            {variant.attributes.map((attribute) => (
              <Tag key={`${variant.id}:${attribute.id}`}>
                {attribute.id}: {attribute.value ?? "—"}
              </Tag>
            ))}
          </Space>
        ) : (
          missingValue
        ),
      span: 2,
    },
  ];

  return (
    <Card
      className={styles.variantCard}
      extra={
        variant.permalink ? (
          <Button
            href={variant.permalink}
            rel="noreferrer"
            size="small"
            target="_blank"
            type="link"
          >
            Ver en Mercado Libre
          </Button>
        ) : null
      }
      size="small"
      title={title}
    >
      <div className={styles.variantContent}>
        {variant.thumbnailUrl ? (
          <Image
            alt={`Imagen de ${title}`}
            preview={false}
            src={variant.thumbnailUrl}
            width={88}
          />
        ) : null}
        <Descriptions
          className={styles.variantDescriptions}
          column={{ xs: 1, md: 2 }}
          items={items}
          layout="vertical"
          size="small"
        />
      </div>
    </Card>
  );
}

function createPublicationDetails(
  publication: PublicationDetail,
): DescriptionsProps["items"] {
  return [
    {
      key: "channel",
      label: "Canal",
      children: channelLabels[publication.channel],
    },
    {
      key: "price",
      label: "Precio",
      children: formatPublicationPrice(publication),
    },
    { key: "stock", label: "Stock", children: publication.stock },
    {
      key: "sold",
      label: "Vendidos",
      children:
        publication.sold === null ? missingValue : publication.sold,
    },
    {
      key: "familyId",
      label: "ID de familia",
      children: valueOrMissing(publication.group.familyId),
    },
    {
      key: "itemId",
      label: "ID del ítem",
      children: valueOrMissing(publication.group.itemId),
    },
    {
      key: "externalKey",
      label: "Clave externa",
      children: publication.group.key,
    },
    { key: "internalId", label: "ID interno", children: publication.id },
  ];
}

function renderStatus(status: string | null): ReactNode {
  return status ? <Tag>{status}</Tag> : missingValue;
}

function valueOrMissing(value: string | null): ReactNode {
  return value ?? missingValue;
}

function formatPublicationPrice(publication: PublicationDetail): ReactNode {
  const from = publication.price?.from ?? null;
  const to = publication.price?.to ?? null;

  if (from === null && to === null) {
    return missingValue;
  }

  const currency = publication.price?.currency ?? null;

  if (from !== null && to !== null && from !== to) {
    return `${formatAmount(from, currency)} – ${formatAmount(to, currency)}`;
  }

  const amount = from ?? to;

  return amount === null ? missingValue : formatAmount(amount, currency);
}

function formatVariantPrice(variant: PublicationVariant): ReactNode {
  return variant.price
    ? formatAmount(variant.price.amount, variant.price.currency)
    : missingValue;
}

function formatAmount(amount: number, currency: string | null): string {
  const formatted = new Intl.NumberFormat("es-AR", {
    maximumFractionDigits: 2,
  }).format(amount);

  return currency ? `${currency} ${formatted}` : formatted;
}
