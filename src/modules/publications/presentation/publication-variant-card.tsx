import { Button, Card, Space, Tag, Typography } from "antd";

import { PublicationStatus } from "./publication-status";
import type { PublicationVariantCardModel } from "./publication-variant-card.model";
import { PublicationVariantGallery } from "./publication-variant-gallery.client";
import styles from "./publication-detail-view.module.css";

type Props = Readonly<{ variant: PublicationVariantCardModel }>;

export function PublicationVariantCard({ variant }: Props) {
  const label = variant.color ?? "Variante sin color";

  return (
    <Card
      className={styles.visualVariantCard}
      title={<span className={styles.variantTitle}>{label}</span>}
      extra={
        variant.complete ? (
          <Tag color="success">✓ Completa</Tag>
        ) : (
          <Tag color="warning">⚠ Revisar</Tag>
        )
      }
    >
      <Space className={styles.variantStatuses} size={4} wrap>
        {variant.statuses.map((status, index) => (
          <PublicationStatus key={`${status ?? "missing"}-${index}`} status={status} />
        ))}
      </Space>

      <Typography.Text className={styles.sectionLabel}>Imágenes</Typography.Text>
      <PublicationVariantGallery label={label} pictures={variant.pictures} />
      <Typography.Text className={styles.imageCount} type="secondary">
        {variant.pictures.length} {variant.pictures.length === 1 ? "imagen" : "imágenes"}
      </Typography.Text>

      <div className={styles.sizesSection}>
        <Typography.Text className={styles.sectionLabel}>Talles</Typography.Text>
        <Space size={[6, 8]} wrap>
          {variant.offers.map((offer) => (
            <Tag className={styles.sizeTag} key={offer.key}>
              {offer.size ?? "Sin talle"} · {formatStock(offer.stock)}
            </Tag>
          ))}
        </Space>
      </div>

      <dl className={styles.variantFacts}>
        <Fact label="Stock total" value={formatNullableNumber(variant.stockTotal)} />
        <Fact label="SKU" value={variant.skus.length > 0 ? variant.skus.join(" · ") : "—"} />
        <Fact label="Precio" value={formatPriceRange(variant.priceRange)} />
        <Fact
          label="Publicaciones"
          value={String(variant.offers.length)}
        />
      </dl>

      <Button className={styles.editLink} href="#edicion-avanzada" type="link">
        Ver detalles / Editar →
      </Button>
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

function formatNullableNumber(value: number | null): string {
  return value === null ? "—" : String(value);
}

function formatPriceRange(
  range: PublicationVariantCardModel["priceRange"],
): string {
  if (!range) return "—";
  const min = formatAmount(range.min, range.currency);
  return range.min === range.max
    ? min
    : `${min} – ${formatAmount(range.max, range.currency)}`;
}

function formatAmount(amount: number, currency: string | null): string {
  const formatted = new Intl.NumberFormat("es-AR", {
    maximumFractionDigits: 2,
  }).format(amount);
  return currency ? `${currency} ${formatted}` : formatted;
}
