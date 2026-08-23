"use client";

import { Button, Image, Input, InputNumber, Table, message } from "antd";
import type { TableColumnsType } from "antd";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { UpdatePublicationInput } from "../application/update-publication.command";
import type { PublicationEditTarget } from "../domain/publication-edit.repository";
import { publicationEditDraftSchema } from "../application/publication-edit.validation";
import { PublicationStatus } from "./publication-status";
import type { PublicationVariantTableRow } from "./publication-variant-row";
import styles from "./publication-detail-view.module.css";

export type PublicationUpdateAction = (
  input: UpdatePublicationInput,
) => Promise<Readonly<{ ok: true } | { ok: false; message: string }>>;

type PublicationVariantsTableProps = Readonly<{
  rows: readonly PublicationVariantTableRow[];
  updateAction?: PublicationUpdateAction;
}>;

const missingValue = <span title="Dato no disponible">—</span>;

export function PublicationVariantsTable(props: PublicationVariantsTableProps) {
  if (!props.updateAction) {
    return <ReadonlyPublicationVariantsTable rows={props.rows} />;
  }
  return <EditablePublicationVariantsTable rows={props.rows} updateAction={props.updateAction} />;
}

function ReadonlyPublicationVariantsTable({ rows }: Readonly<{ rows: readonly PublicationVariantTableRow[] }>) {
  const columns: TableColumnsType<PublicationVariantTableRow> = [
    { title: "Imagen", key: "image", render: (_, row) => row.imageUrl ? <Image alt={`Imagen de ${row.publicationId}`} preview={false} src={row.imageUrl} width={48} /> : missingValue },
    { title: "ID publicación", dataIndex: "publicationId", key: "publicationId" },
    { title: "ID producto", dataIndex: "userProductId", key: "userProductId", render: (value: string | null) => value ?? missingValue },
    { title: "Estado", key: "status", render: (_, row) => <PublicationStatus status={row.status} /> },
    { title: "Precio", key: "price", render: (_, row) => formatPrice(row.price) },
    { title: "Stock", dataIndex: "stock", key: "stock", render: (value: number | null) => value ?? missingValue },
    { title: "Vendidos", dataIndex: "sold", key: "sold", render: (value: number | null) => value ?? missingValue },
    { title: "Color", dataIndex: "color", key: "color", render: (value: string | null) => value ?? missingValue },
    { title: "Talle", dataIndex: "size", key: "size", render: (value: string | null) => value ?? missingValue },
    { title: "Acción", key: "action", render: (_, row) => row.permalink ? <Button href={row.permalink} rel="noreferrer" target="_blank" type="link">Ver en Mercado Libre</Button> : missingValue },
  ];
  return <div className={styles.variantTable} aria-label="Variantes de la publicación" role="region"><Table<PublicationVariantTableRow> columns={columns} dataSource={[...rows]} pagination={false} rowKey="key" scroll={{ x: 1050 }} size="small" /></div>;
}

function EditablePublicationVariantsTable({ rows, updateAction }: PublicationVariantsTableProps & { updateAction: PublicationUpdateAction }) {
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [draft, setDraft] = useState<{ sku: string; price: number | null; stock: number | null } | null>(null);
  const [saving, setSaving] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();
  const router = useRouter();
  const editingRow = rows.find((row) => row.key === editingKey);

  const startEditing = (row: PublicationVariantTableRow) => {
    if (!updateAction) return;
    setEditingKey(row.key);
    setDraft({ sku: row.sku ?? "", price: row.price?.amount ?? null, stock: row.stock });
  };

  const save = async () => {
    if (!editingRow || !draft || !updateAction) return;
    const parsed = publicationEditDraftSchema.safeParse(draft);
    if (!parsed.success) {
      messageApi.error("Precio, stock o SKU no son válidos.");
      return;
    }
    setSaving(true);
    try {
      const result = await updateAction({
        target: toEditTarget(editingRow),
        current: { sku: editingRow.sku, price: editingRow.price?.amount ?? null, stock: editingRow.stock },
        draft: parsed.data,
      });
      if (!result.ok) {
        messageApi.error(result.message);
        return;
      }
      messageApi.success("Publicación actualizada.");
      setEditingKey(null);
      setDraft(null);
      router.refresh();
    } finally {
      setSaving(false);
    }
  };

  const columns: TableColumnsType<PublicationVariantTableRow> = [
    {
      title: "Imagen", key: "image", width: 80,
      render: (_, row) => row.imageUrl ? <Image alt={`Imagen de ${row.publicationId}`} preview={false} src={row.imageUrl} width={48} /> : missingValue,
    },
    { title: "ID publicación", dataIndex: "publicationId", key: "publicationId" },
    { title: "ID producto", dataIndex: "userProductId", key: "userProductId", render: (value: string | null) => value ?? missingValue },
    { title: "SKU", key: "sku", render: (_, row) => editingRow?.key === row.key && draft ? <Input value={draft.sku} disabled={row.variationId === null && row.familyId === null && row.itemId === null} onChange={(event) => setDraft({ ...draft, sku: event.target.value })} /> : row.sku ?? missingValue },
    { title: "Estado", key: "status", render: (_, row) => <PublicationStatus status={row.status} /> },
    { title: "Precio", key: "price", render: (_, row) => editingRow?.key === row.key && draft ? <InputNumber min={0.01} value={draft.price} onChange={(value) => setDraft({ ...draft, price: typeof value === "number" ? value : null })} /> : <span>{formatPrice(row.price)}{row.variationId !== null ? <small>El precio se aplicará a todas las variaciones.</small> : null}</span> },
    { title: "Stock", key: "stock", render: (_, row) => editingRow?.key === row.key && draft ? <InputNumber min={0} precision={0} disabled={row.familyId === null && row.variationId !== null} value={draft.stock} onChange={(value) => setDraft({ ...draft, stock: typeof value === "number" ? value : null })} /> : row.stock ?? missingValue },
    { title: "Vendidos", dataIndex: "sold", key: "sold", render: (value: number | null) => value ?? missingValue },
    { title: "Color", dataIndex: "color", key: "color", render: (value: string | null) => value ?? missingValue },
    { title: "Talle", dataIndex: "size", key: "size", render: (value: string | null) => value ?? missingValue },
    {
      title: "Acciones", key: "action",
      render: (_, row) => editingRow?.key === row.key ? (
        <span>
          <Button type="link" loading={saving} onClick={save}>Guardar</Button>
          <Button type="link" disabled={saving} onClick={() => { setEditingKey(null); setDraft(null); }}>Cancelar</Button>
          {row.variationId !== null ? <small>Precio aplica a todas las variaciones</small> : null}
        </span>
      ) : (
        <span>
          <Button type="link" onClick={() => startEditing(row)}>Editar</Button>
          {row.permalink ? <Button href={row.permalink} rel="noreferrer" target="_blank" type="link">Ver en Mercado Libre</Button> : missingValue}
        </span>
      ),
    },
  ];

  return <>
    {contextHolder}
    <div className={styles.variantTable} aria-label="Variantes de la publicación" role="region">
      <Table<PublicationVariantTableRow> columns={columns} dataSource={[...rows]} pagination={false} rowKey="key" scroll={{ x: 1250 }} size="small" />
    </div>
  </>;
}

function toEditTarget(row: PublicationVariantTableRow): PublicationEditTarget {
  return row.familyId
    ? { type: "family", familyId: row.familyId, itemId: row.itemId ?? row.publicationId }
    : { type: "legacy", itemId: row.itemId ?? row.publicationId, variationId: row.variationId };
}

function formatPrice(price: PublicationVariantTableRow["price"]): React.ReactNode {
  if (!price) return missingValue;
  const amount = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 2 }).format(price.amount);
  return price.currency ? `${price.currency} ${amount}` : amount;
}
