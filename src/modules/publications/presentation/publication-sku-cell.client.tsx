"use client";

import { CheckOutlined, LoadingOutlined } from "@ant-design/icons";
import { Input } from "antd";
import { useRef, useState } from "react";

import type { PublicationVariantTableRow } from "./publication-variant-row";
import { toPublicationEditTarget } from "./publication-variant-row";
import type { PublicationInlineUpdateAction } from "./publication-stock-cell.client";
import styles from "./publications-view.module.css";
import { CopyableText } from "@/shared/ui/copyable-text.client";

type Props = Readonly<{ row: PublicationVariantTableRow; updateAction: PublicationInlineUpdateAction; onError: (message: string) => void }>;

export function PublicationSkuCell({ row, updateAction, onError }: Props) {
  const [editing, setEditing] = useState(false);
  const [sku, setSku] = useState(row.sku ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const committed = useRef(row.sku ?? "");
  const valueRef = useRef(row.sku ?? "");
  const savingRef = useRef(false);

  async function save(): Promise<void> {
    const nextSku = valueRef.current.trim();
    if (savingRef.current) return;
    if (nextSku === committed.current) { setEditing(false); return; }
    if (!nextSku) { rollback("El SKU no puede quedar vacío."); return; }
    savingRef.current = true;
    setSaving(true);
    setSaved(false);
    try {
      const result = await updateAction({
        publicationId: row.publicationId,
        target: toPublicationEditTarget(row),
        current: { sku: committed.current || null, price: row.price?.amount ?? null, stock: row.stock },
        draft: { sku: nextSku, price: row.price?.amount ?? null, stock: row.stock },
      });
      if (!result.ok) throw new Error(result.message);
      if (result.confirmed.sku !== nextSku) throw new Error("Mercado Libre todavía no confirmó el nuevo SKU.");
      committed.current = nextSku;
      valueRef.current = nextSku;
      setSku(nextSku);
      setEditing(false);
      setSaved(true);
      window.setTimeout(() => setSaved(false), 1400);
    } catch (error: unknown) {
      rollback(error instanceof Error ? error.message : "No se pudo actualizar el SKU.");
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }

  function rollback(message: string): void {
    valueRef.current = committed.current;
    setSku(committed.current);
    setEditing(false);
    onError(message);
  }

  if (editing) return <span className={styles.inlineEditCell}><Input autoFocus aria-label={`SKU de ${row.size ?? row.publicationId}`} disabled={saving} size="small" value={sku} onBlur={() => void save()} onChange={(event) => { valueRef.current = event.target.value; setSku(event.target.value); }} onPressEnter={() => void save()} />{saving ? <LoadingOutlined aria-label="Guardando SKU" spin /> : null}</span>;

  return <span className={styles.inlineEditCell}><button className={styles.inlineEditValue} type="button" onClick={() => setEditing(true)}>{sku || "Sin SKU"}</button>{sku ? <CopyableText value={sku} label="" copyLabel="SKU" /> : null}{saved ? <CheckOutlined aria-label="SKU guardado" style={{ color: "#52c41a" }} /> : null}</span>;
}
