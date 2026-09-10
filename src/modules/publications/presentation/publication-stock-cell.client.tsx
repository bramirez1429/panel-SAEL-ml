"use client";

import { CheckOutlined, LoadingOutlined } from "@ant-design/icons";
import { InputNumber } from "antd";
import { useEffect, useRef, useState } from "react";

import type { UpdatePublicationInput } from "../application/update-publication.command";
import type { PublicationEditStatus } from "../domain/publication-edit.repository";
import type { PublicationVariantTableRow } from "./publication-variant-row";
import { toPublicationEditTarget } from "./publication-variant-row";

export type PublicationInlineUpdateAction = (input: UpdatePublicationInput) => Promise<
  Readonly<{
    ok: true;
    confirmed: Readonly<{ sku?: string | null; price?: number | null; stock?: number | null; status?: PublicationEditStatus }>;
  } | { ok: false; message: string }>
>;
export type InlineStockUpdateAction = PublicationInlineUpdateAction;

type Props = Readonly<{
  row: PublicationVariantTableRow;
  updateAction: InlineStockUpdateAction;
  onError: (message: string) => void;
}>;

export function PublicationStockCell({ row, updateAction, onError }: Props) {
  const [stock, setStock] = useState(row.stock);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const committed = useRef(row.stock);
  const savingRef = useRef(false);
  const stockRef = useRef(row.stock);

  useEffect(() => {
    if (savingRef.current) return;
    committed.current = row.stock;
    stockRef.current = row.stock;
    setStock(row.stock);
  }, [row.stock]);

  const save = async () => {
    const nextStock = stockRef.current;
    if (savingRef.current || nextStock === committed.current) return;
    if (nextStock === null || !Number.isInteger(nextStock) || nextStock < 0) {
      stockRef.current = committed.current;
      setStock(committed.current);
      onError("El stock debe ser un entero mayor o igual a cero.");
      return;
    }

    savingRef.current = true;
    setSaving(true);
    setSaved(false);
    try {
      const result = await updateAction({
        publicationId: row.publicationId,
        target: toPublicationEditTarget(row),
        current: { sku: row.sku, price: row.price?.amount ?? null, stock: committed.current },
        draft: { sku: row.sku, price: row.price?.amount ?? null, stock: nextStock },
      });
      if (!result.ok) throw new Error(result.message);
      if (result.confirmed.stock !== nextStock) {
        throw new Error("Mercado Libre todavía no confirmó el nuevo stock.");
      }
      committed.current = nextStock;
      setSaved(true);
      window.setTimeout(() => setSaved(false), 1400);
    } catch (error: unknown) {
      stockRef.current = committed.current;
      setStock(committed.current);
      onError(error instanceof Error ? error.message : "No se pudo actualizar el stock.");
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
      <InputNumber
        aria-label={`Stock de ${row.size ?? row.sku ?? row.publicationId}`}
        controls={false}
        disabled={saving}
        min={0}
        precision={0}
        size="small"
        style={{ width: 72 }}
        value={stock}
        onBlur={() => void save()}
        onChange={(value) => {
          const next = typeof value === "number" ? value : null;
          stockRef.current = next;
          setStock(next);
        }}
        onPressEnter={() => void save()}
      />
      {saving ? <LoadingOutlined aria-label="Guardando stock" spin /> : null}
      {saved ? <CheckOutlined aria-label="Stock guardado" style={{ color: "#52c41a" }} /> : null}
    </span>
  );
}
