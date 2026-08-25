"use client";

import { Button, Image, Input, InputNumber, Table, message } from "antd";
import type { TableColumnsType } from "antd";
import { useRouter } from "next/navigation";
import { useState } from "react";

import type { UpdatePublicationInput } from "../application/update-publication.command";
import { getPublicationEditChanges, validatePublicationEditChanges } from "../application/publication-edit.validation";
import type { PublicationEditTarget } from "../domain/publication-edit.repository";
import type { PublicationEditStatus } from "../domain/publication-edit.repository";
import { PublicationStatus } from "./publication-status";
import type { PublicationVariantTableRow, PublicationVariationTableRow } from "./publication-variant-row";
import { groupFamilyRows } from "./publication-variant-row";
import { PublicationStatusSwitch, type PublicationStatusUpdateAction } from "./publication-status-switch.client";
import styles from "./publication-detail-view.module.css";

export type PublicationUpdateAction = (input: UpdatePublicationInput) => Promise<
  Readonly<{ ok: true; confirmed: Readonly<{ sku?: string | null; price?: number | null; stock?: number | null; status?: PublicationEditStatus }> } | { ok: false; message: string }>
>;

export type PublicationStatusAction = PublicationStatusUpdateAction;
type Props = Readonly<{ rows: readonly PublicationVariantTableRow[]; updateAction?: PublicationUpdateAction; statusAction?: PublicationStatusAction }>;
type Draft = { sku: string; price: number | null; stock: number | null };
const missingValue = <span title="Dato no disponible">—</span>;

export function PublicationVariantsTable({ rows, updateAction, statusAction }: Props) {
  if (!updateAction) return <ReadOnlyTable rows={rows} />;
  return <EditableTables rows={rows} updateAction={updateAction} statusAction={statusAction} />;
}

function ReadOnlyTable({ rows }: Readonly<{ rows: readonly PublicationVariantTableRow[] }>) {
  const family = rows.some((row) => row.familyId !== null);
  if (family) {
    const groups = groupFamilyRows(rows);
    return <Table<PublicationVariationTableRow> columns={familyColumns()} dataSource={[...groups]} expandable={{ expandedRowRender: (group) => <OfferTable rows={group.offers} />, rowExpandable: (group) => group.offers.length > 0 }} pagination={false} rowKey="key" scroll={{ x: 1100 }} size="small" />;
  }
  return <Table<PublicationVariantTableRow> columns={legacyColumns()} dataSource={[...rows]} pagination={false} rowKey="key" scroll={{ x: 1050 }} size="small" />;
}

function EditableTables({ rows, updateAction, statusAction }: { rows: readonly PublicationVariantTableRow[]; updateAction: PublicationUpdateAction; statusAction?: PublicationStatusAction }) {
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmed, setConfirmed] = useState<Record<string, Readonly<{ sku?: string | null; price?: number | null; stock?: number | null; status?: PublicationEditStatus }>>>({});
  const [messageApi, contextHolder] = message.useMessage();
  const router = useRouter();
  const family = rows.some((row) => row.familyId !== null);
  const displayRows = rows.map((row) => applyConfirmed(row, confirmed[row.key]));
  const groups = family ? groupFamilyRows(displayRows) : [];

  const startEditing = (row: PublicationVariantTableRow) => {
    setEditingKey(row.key);
    setDraft({ sku: row.sku ?? "", price: row.price?.amount ?? null, stock: row.stock });
  };
  const save = async (row: PublicationVariantTableRow) => {
    if (!draft || saving) return;
    const current = { sku: row.sku, price: row.price?.amount ?? null, stock: row.stock };
    const changes = getPublicationEditChanges(current, draft);
    const validation = validatePublicationEditChanges(changes);
    if (!validation.success) { messageApi.error(validation.message); return; }
    if (Object.keys(changes).length === 0) { messageApi.info("No hay cambios para guardar."); return; }
    setSaving(true);
    try {
      const result = await updateAction({
        publicationId: row.publicationId,
        target: toEditTarget(row),
        current,
        draft,
      });
      if (!result.ok) { messageApi.error(result.message); return; }
      setConfirmed((previous) => ({ ...previous, [row.key]: result.confirmed }));
      setEditingKey(null);
      setDraft(null);
      messageApi.success("Publicación actualizada.");
      router.refresh();
    } catch (error: unknown) {
      messageApi.error(error instanceof Error ? error.message : "No se pudo preparar la actualización.");
    } finally { setSaving(false); }
  };
  const editCell = (row: PublicationVariantTableRow, field: keyof Draft) => {
    if (editingKey !== row.key || !draft) return null;
    if (field === "sku") return <Input value={draft.sku} onChange={(event) => setDraft({ ...draft, sku: event.target.value })} />;
    return <InputNumber min={field === "price" ? 0.01 : 0} precision={field === "stock" ? 0 : undefined} value={draft[field]} onChange={(value) => setDraft({ ...draft, [field]: typeof value === "number" ? value : null })} />;
  };
  const cancelEditing = () => { if (saving) return; setEditingKey(null); setDraft(null); };
  const actions = (row: PublicationVariantTableRow) => editingKey === row.key ? <><Button type="link" loading={saving} onClick={() => save(row)}>Guardar</Button><Button type="link" onClick={cancelEditing}>Cancelar</Button></> : <><Button type="link" onClick={() => startEditing(row)}>Editar</Button>{row.permalink ? <Button href={row.permalink} rel="noreferrer" target="_blank" type="link">Ver en Mercado Libre</Button> : missingValue}</>;

  const legacy = legacyColumns(editCell, actions);
  const familyMain = familyColumns(editCell, actions);
  const offerColumns: TableColumnsType<PublicationVariantTableRow> = [
    { title: "ID publicación", dataIndex: "publicationId", key: "publicationId" },
    { title: "Precio", key: "price", render: (_, row) => editCell(row, "price") ?? <span>{formatPrice(row.price)} <small>Precio de esta oferta</small></span> },
    { title: "Estado", key: "status", render: (_, row) => <PublicationStatusSwitch key={`${row.key}-${row.status}`} publicationId={row.publicationId} target={toEditTarget(row)} initialStatus={row.status} action={statusAction} onConfirmed={(status) => setConfirmed((previous) => ({ ...previous, [row.key]: { ...previous[row.key], status } }))} /> },
    { title: "Vendidos", dataIndex: "sold", key: "sold", render: (value: number | null) => value ?? missingValue },
    { title: "Acciones", key: "actions", render: (_, row) => actions(row) },
  ];
  return <>{contextHolder}<div className={styles.variantTable} role="region" aria-label="Variantes de la publicación">
    {family ? <Table<PublicationVariationTableRow> columns={familyMain} dataSource={[...groups]} expandable={{ expandedRowRender: (group) => <Table<PublicationVariantTableRow> columns={offerColumns} dataSource={[...group.offers]} pagination={false} rowKey="key" scroll={{ x: 700 }} size="small" />, rowExpandable: (group) => group.offers.length > 0 }} pagination={false} rowKey="key" scroll={{ x: 1100 }} size="small" /> : <Table<PublicationVariantTableRow> columns={legacy} dataSource={displayRows} pagination={false} rowKey="key" scroll={{ x: 1150 }} size="small" />}
  </div></>;
}

function familyColumns(editCell?: (row: PublicationVariantTableRow, field: keyof Draft) => React.ReactNode, actions?: (row: PublicationVariantTableRow) => React.ReactNode): TableColumnsType<PublicationVariationTableRow> {
  return [
    { title: "Imagen", key: "image", render: (_, group) => group.representative.imageUrl ? <Image alt={`Imagen de ${group.userProductId}`} preview={false} src={group.representative.imageUrl} width={48} /> : missingValue },
    { title: "ID producto", dataIndex: "userProductId", key: "userProductId" },
    { title: "SKU", key: "sku", render: (_, group) => editCell ? editCell(group.representative, "sku") ?? group.representative.sku ?? missingValue : group.representative.sku ?? missingValue },
    { title: "Color", key: "color", render: (_, group) => group.representative.color ?? missingValue },
    { title: "Talle", key: "size", render: (_, group) => group.representative.size ?? missingValue },
    { title: "Stock", key: "stock", render: (_, group) => editCell ? editCell(group.representative, "stock") ?? group.representative.stock ?? missingValue : group.representative.stock ?? missingValue },
    { title: "Vendidos", key: "sold", render: (_, group) => group.representative.sold ?? missingValue },
    { title: "Estado", key: "status", render: (_, group) => <PublicationStatus status={group.representative.status} /> },
    { title: "Publicaciones", key: "offers", render: (_, group) => group.offers.length },
    ...(actions ? [{ title: "Acciones", key: "actions", render: (_: unknown, group: PublicationVariationTableRow) => actions(group.representative) }] : []),
  ];
}

function legacyColumns(editCell?: (row: PublicationVariantTableRow, field: keyof Draft) => React.ReactNode, actions?: (row: PublicationVariantTableRow) => React.ReactNode): TableColumnsType<PublicationVariantTableRow> {
  return [
    { title: "Imagen", key: "image", render: (_, row) => row.imageUrl ? <Image alt={`Imagen de ${row.publicationId}`} preview={false} src={row.imageUrl} width={48} /> : missingValue },
    { title: "ID publicación", dataIndex: "publicationId", key: "publicationId" },
    { title: "ID producto", dataIndex: "userProductId", key: "userProductId", render: (value: string | null) => value ?? missingValue },
    { title: "SKU", key: "sku", render: (_, row) => editCell ? editCell(row, "sku") ?? row.sku ?? missingValue : row.sku ?? missingValue },
    { title: "Color", dataIndex: "color", key: "color", render: (value: string | null) => value ?? missingValue },
    { title: "Talle", dataIndex: "size", key: "size", render: (value: string | null) => value ?? missingValue },
    { title: "Precio", key: "price", render: (_, row) => editCell ? editCell(row, "price") ?? formatPrice(row.price) : formatPrice(row.price) },
    { title: "Stock", key: "stock", render: (_, row) => editCell ? editCell(row, "stock") ?? row.stock ?? missingValue : row.stock ?? missingValue },
    { title: "Vendidos", dataIndex: "sold", key: "sold", render: (value: number | null) => value ?? missingValue },
    { title: "Estado", key: "status", render: (_, row) => <PublicationStatus status={row.status} /> },
    ...(actions ? [{ title: "Acciones", key: "actions", render: (_: unknown, row: PublicationVariantTableRow) => actions(row) }] : []),
  ];
}

export function toEditTarget(row: PublicationVariantTableRow): PublicationEditTarget {
  if (row.publicationType === "USER_PRODUCT") {
    if (!row.familyId) throw new Error("La familia no tiene familyId disponible para editar.");
    return { type: "family", familyId: row.familyId, itemId: row.itemId ?? row.publicationId };
  }
  return { type: "legacy", itemId: row.itemId ?? row.publicationId, variationId: row.variationId };
}
function applyConfirmed(row: PublicationVariantTableRow, values: Readonly<{ sku?: string | null; price?: number | null; stock?: number | null; status?: PublicationEditStatus }> | undefined): PublicationVariantTableRow {
  if (!values) return row;
  return {
    ...row,
    sku: values.sku === undefined ? row.sku : values.sku,
    stock: values.stock === undefined ? row.stock : values.stock,
    status: values.status === undefined ? row.status : values.status,
    price: values.price === undefined ? row.price : values.price === null ? null : { amount: values.price, currency: row.price?.currency ?? null },
  };
}
function formatPrice(price: PublicationVariantTableRow["price"]): React.ReactNode { if (!price) return missingValue; const amount = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 2 }).format(price.amount); return price.currency ? `${price.currency} ${amount}` : amount; }
function OfferTable({ rows }: { rows: readonly PublicationVariantTableRow[] }) { return <Table<PublicationVariantTableRow> columns={[{ title: "ID publicación", dataIndex: "publicationId", key: "publicationId" }, { title: "Precio", key: "price", render: (_, row) => formatPrice(row.price) }, { title: "Estado", key: "status", render: (_, row) => <PublicationStatus status={row.status} /> }, { title: "Vendidos", dataIndex: "sold", key: "sold", render: (value: number | null) => value ?? missingValue }, { title: "Ver en Mercado Libre", key: "link", render: (_, row) => row.permalink ? <Button href={row.permalink} rel="noreferrer" target="_blank" type="link">Ver en Mercado Libre</Button> : missingValue }]} dataSource={[...rows]} pagination={false} rowKey="key" size="small" />; }
