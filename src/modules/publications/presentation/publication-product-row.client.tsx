"use client";

import { DeleteOutlined, MoreOutlined } from "@ant-design/icons";
import { Button, Dropdown, Image, Modal, Tag, Tooltip, message } from "antd";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import type { Publication } from "../domain/publication.model";
import { PublicationStockCell, type InlineStockUpdateAction } from "./publication-stock-cell.client";
import { PublicationSkuCell } from "./publication-sku-cell.client";
import { compareRows, createPublicationVariantRows, groupFamilyRows } from "./publication-variant-row";
import { PublicationSoldCount } from "./publication-sold-count";
import { PublicationStatus } from "./publication-status";
import styles from "./publications-view.module.css";
import { TiendanubeReplicationCell, type ReplicatePublicationAction } from "@/modules/tiendanube/presentation/tiendanube-replication-cell.client";
import type { TiendanubeCategory, TiendanubeReplicationState } from "@/modules/tiendanube/domain/tiendanube-replication.model";
import { CopyableText } from "@/shared/ui/copyable-text.client";

type Props = Readonly<{
  publication: Publication;
  tiendanubeState: TiendanubeReplicationState;
  replicateAction: ReplicatePublicationAction;
  categories: readonly TiendanubeCategory[];
  updateAction?: InlineStockUpdateAction;
  deleteVariationAction?: DeleteVariationAction;
  detailHref: string;
  similarHref: string;
  onStockError: (message: string) => void;
}>;

export type DeleteVariationAction = (input: Readonly<{
  publicationId: string;
  publicationType: "LEGACY" | "USER_PRODUCT";
  itemId: string;
  variationId: number;
}>) => Promise<Readonly<{ ok: true } | { ok: false; code?: string; message: string }>>;

const missingValue = <span title="Dato no disponible">—</span>;

export function PublicationProductRow({ publication, tiendanubeState, replicateAction, categories, updateAction, deleteVariationAction, detailHref, similarHref, onStockError }: Props) {
  const router = useRouter();
  const [modalApi, modalContextHolder] = Modal.useModal();
  const [messageApi, messageContextHolder] = message.useMessage();
  const [deletingVariationId, setDeletingVariationId] = useState<number | null>(null);
  const rows = createPublicationVariantRows(publication);
  const isFamily = publication.group.type === "USER_PRODUCT";
  const hasVariants = Boolean(publication.variants?.length);
  const variants = isFamily
    ? groupFamilyRows(rows)
    : [...rows].sort(compareRows).map((row) => ({ key: row.key, representative: row, offers: [row] }));
  const mainStockRow = !hasVariants ? rows[0] : undefined;

  const onDeleteVariation = (row: (typeof rows)[number]) => {
    if (!deleteVariationAction || !row.itemId || row.variationId === null || deletingVariationId !== null) return;
    const itemId = row.itemId;
    const variationId = row.variationId;

    const confirmation: ReturnType<typeof modalApi.confirm> = modalApi.confirm({
      title: "¿Eliminar talle?",
      content: (
        <>
          <p>¿Estás seguro de borrar el talle {row.size ?? "—"}?</p>
          <p><strong>Color:</strong> {row.color ?? "—"}</p>
          <p>Esta acción eliminará esta variante de Mercado Libre.</p>
        </>
      ),
      okText: "Eliminar",
      cancelText: "Cancelar",
      okButtonProps: { danger: true },
      onOk: async () => {
        setDeletingVariationId(variationId);
        confirmation.update({
          okText: "Eliminando...",
          okButtonProps: { danger: true, loading: true, disabled: true },
          cancelButtonProps: { disabled: true },
          closable: false,
          keyboard: false,
          mask: { closable: false },
        });
        try {
          const result = await deleteVariationAction({
            publicationId: publication.id,
            publicationType: row.publicationType,
            itemId,
            variationId,
          });
          if (!result.ok) {
            messageApi.error(result.message);
            confirmation.destroy();
            return;
          }
          confirmation.destroy();
          messageApi.success("Talle eliminado correctamente");
          router.refresh();
        } catch (error: unknown) {
          messageApi.error(error instanceof Error ? error.message : "No se pudo eliminar la variante.");
          confirmation.destroy();
        } finally {
          setDeletingVariationId(null);
        }
      },
    });
  };

  return (
    <>
      {modalContextHolder}
      {messageContextHolder}
    <article className={styles.productBlock} aria-label={`Publicación ${publication.title}`}>
      <aside className={styles.productIdentity}>
        {publication.thumbnailUrl ? <Image alt={`Imagen de ${publication.title}`} height={78} preview={false} src={publication.thumbnailUrl} width={78} /> : <span className={styles.productImagePlaceholder} title="Imagen no disponible">—</span>}
        <TiendanubeReplicationCell action={replicateAction} initialState={tiendanubeState} sourceKey={publication.group.key} categories={categories} />
        <PublicationStatus status={publication.status ?? rows[0]?.status ?? null} />
        <Tag>Mercado Libre</Tag>
        <Tag color={isFamily ? "blue" : "default"}>{isFamily ? "Familia" : "Anterior"}</Tag>
        <CopyableId label="Family ID" values={publication.group.familyId ? [publication.group.familyId] : []} />
        {!isFamily ? <CopyableId label="MLA" values={[publication.group.itemId ?? publication.id]} /> : null}
      </aside>

      <div className={styles.productHeading}><span className={styles.columnLabel}>Producto</span><strong className={styles.productTitle}>{publication.title}</strong></div>
      <SummaryCell label="MLA">{missingValue}</SummaryCell>
      <SummaryCell label="Vendidos"><PublicationSoldCount value={publication.sold} /></SummaryCell>
      <SummaryCell label="Stock total">{mainStockRow && updateAction ? <PublicationStockCell row={mainStockRow} updateAction={updateAction} onError={onStockError} /> : publication.stock}</SummaryCell>
      <SummaryCell label="Precio">{formatPrice(publication.price)}</SummaryCell>
      <SummaryCell label="Precio promocional">{missingValue}</SummaryCell>
      <SummaryCell label="Acciones"><Actions title={publication.title} detailHref={detailHref} similarHref={similarHref} permalink={publication.permalink} /></SummaryCell>

      {hasVariants && variants.length > 0 ? (
        <div className={styles.variantList} role="table" aria-label={`Variantes de ${publication.title}`}>
          <div className={styles.variantHeader} role="row">
            <span>Variante</span><span>MLA</span><span>Vendidos</span><span>Stock</span><span>Precio</span><span>Promocional</span><span>Acciones</span>
          </div>
          {variants.map(({ key, representative: row, offers }) => (
            <div className={styles.variantRow} role="row" key={key}>
              <span className={styles.variantIdentity}><strong>{variantName(row.color, row.size)}</strong>{updateAction ? <PublicationSkuCell row={row} updateAction={updateAction} onError={onStockError} /> : row.sku ? <CopyableText value={row.sku} label={row.sku} copyLabel="SKU" /> : missingValue}</span>
              <span className={styles.variantMla}>{unique(offers.map((offer) => offer.itemId ?? offer.publicationId)).map((itemId) => <CopyableText value={itemId} label={itemId} copyLabel="MLA" key={itemId} />)}</span>
              <span><PublicationSoldCount value={row.sold} compact /></span>
              <span>{updateAction ? <PublicationStockCell row={row} updateAction={updateAction} onError={onStockError} /> : row.stock ?? missingValue}</span>
              <span>{formatVariantPrice(row.price)}</span>
              <span>{missingValue}</span>
              <span><Tooltip title="Eliminar variante"><Button aria-label={`Eliminar variante ${variantNameText(row.color, row.size)}`} icon={<DeleteOutlined />} loading={deletingVariationId === row.variationId} disabled={!deleteVariationAction || !row.itemId || row.variationId === null || deletingVariationId !== null} onClick={() => onDeleteVariation(row)} size="small" style={{ cursor: "pointer" }} type="text" /></Tooltip></span>
            </div>
          ))}
        </div>
      ) : null}
    </article>
    </>
  );
}

function SummaryCell({ label, children }: Readonly<{ label: string; children: React.ReactNode }>) {
  return <div className={styles.summaryCell}><span className={styles.columnLabel}>{label}</span><span>{children}</span></div>;
}

function CopyableId({ label, values }: Readonly<{ label: string; values: readonly string[] }>) {
  if (values.length === 0) return null;
  return <div className={styles.identifier}><small>{label}</small>{values.map((value) => <CopyableText value={value} label={value} copyLabel={label} key={value} />)}</div>;
}

function Actions({ title, detailHref, similarHref, permalink }: Readonly<{ title: string; detailHref: string; similarHref: string; permalink: string | null }>) {
  return <Dropdown menu={{ items: [{ key: "detail", label: <Link href={detailHref}>Ver detalle / editar</Link> }, { key: "similar", label: <Link href={similarHref}>Publicar similar</Link> }, ...(permalink ? [{ key: "mercado-libre", label: <a href={permalink} rel="noreferrer" target="_blank">Ver en Mercado Libre</a> }] : [])] }} trigger={["click"]}><Button aria-label={`Acciones de ${title}`} icon={<MoreOutlined />} type="text" /></Dropdown>;
}

function unique(values: readonly string[]): readonly string[] { return [...new Set(values)]; }
function variantName(color: string | null, size: string | null): React.ReactNode { return [color, size].filter(Boolean).join(" / ") || missingValue; }
function variantNameText(color: string | null, size: string | null): string { return [color, size].filter(Boolean).join(" / ") || "sin nombre"; }
function formatVariantPrice(price: ReturnType<typeof createPublicationVariantRows>[number]["price"]): React.ReactNode { return price ? formatAmount(price.amount, price.currency) : missingValue; }
function formatPrice(price: Publication["price"]): React.ReactNode {
  if (!price || (price.from === null && price.to === null)) return missingValue;
  if (price.from !== null && price.to !== null && price.from !== price.to) return `${formatAmount(price.from, price.currency)} — ${formatAmount(price.to, price.currency)}`;
  return formatAmount(price.from ?? price.to!, price.currency);
}
function formatAmount(value: number, currency: string | null): string {
  const amount = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 2 }).format(value);
  return currency ? `${currency} ${amount}` : amount;
}
