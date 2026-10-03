"use client";

import {
  CheckOutlined,
  CopyOutlined,
  EditOutlined,
  LoadingOutlined,
  PictureOutlined,
} from "@ant-design/icons";
import { Button, Card, Image, Input, InputNumber, message, Space, Switch, Tag, Typography } from "antd";
import { useState } from "react";

import type { UpdatePublicationInput } from "@/modules/publications/application/update-publication.command";
import type { PublicationEditStatus, PublicationEditTarget } from "@/modules/publications/domain/publication-edit.repository";
import { generatePublicationSku } from "@/shared/lib/publication-sku";
import { publicationTitlePresentation } from "@/shared/lib/publication-size";
import { PublicationSizeTag } from "@/shared/ui/publication-size-tag";

import type {
  PublicationWorkspaceFamily,
  PublicationWorkspaceItem,
} from "../domain/publication-workspace.model";
import styles from "./publication-promotion-workspace.module.css";

export type WorkspaceSaveAction = (input: UpdatePublicationInput) => Promise<
  | Readonly<{ ok: true; confirmed: Readonly<{ sku?: string | null; stock?: number | null; price?: number | null }> }>
  | Readonly<{ ok: false; message: string }>
>;

export type WorkspaceStatusAction = (input: Readonly<{
  publicationId: string;
  target: PublicationEditTarget;
  status: PublicationEditStatus;
}>) => Promise<Readonly<{ ok: true; confirmed: PublicationEditStatus } | { ok: false; message: string }>>;

export type WorkspaceTitleTarget =
  | Readonly<{ type: "publication"; itemId: string }>
  | Readonly<{ type: "family"; familyId: string }>;

export type WorkspaceTitleAction = (input: Readonly<{
  target: WorkspaceTitleTarget;
  title: string;
}>) => Promise<Readonly<
  | { ok: true; title: string; family?: PublicationWorkspaceFamily }
  | { ok: false; message: string }
>>;

type Props = Readonly<{
  publication: PublicationWorkspaceItem;
  onChanged?: () => void | Promise<void>;
  onSave: WorkspaceSaveAction;
  onStatusChange: WorkspaceStatusAction;
  onTitleSave: WorkspaceTitleAction;
  showFamilyId?: boolean;
  titleTarget?: WorkspaceTitleTarget;
}>;

export function PublicationWorkspaceEditor({ publication, onChanged, onSave, onStatusChange, onTitleSave, showFamilyId = false, titleTarget }: Props) {
  const [messageApi, contextHolder] = message.useMessage();
  const [sku, setSku] = useState(publication.sku ?? "");
  const [stock, setStock] = useState<number | null>(publication.stock);
  const [savedSku, setSavedSku] = useState(publication.sku ?? "");
  const [savedStock, setSavedStock] = useState(publication.stock);
  const [price, setPrice] = useState<number | null>(publication.standardPrice ?? publication.price);
  const [savedPrice, setSavedPrice] = useState<number | null>(publication.standardPrice ?? publication.price);
  const [savingField, setSavingField] = useState<"sku" | "stock" | "price" | null>(null);
  const [savedField, setSavedField] = useState<"sku" | "stock" | "price" | null>(null);
  const [status, setStatus] = useState(publication.status);
  const [statusSaving, setStatusSaving] = useState(false);
  const target = editTarget(publication);
  const titlePresentation = publicationTitlePresentation(publication.title);

  async function saveSku() {
    const nextSku = sku.trim();
    if (savingField || nextSku === savedSku) return;
    if (!nextSku) return rollbackSku("El SKU no puede quedar vacío.");

    setSavingField("sku");
    setSavedField(null);
    try {
      const result = await onSave({
        publicationId: publication.itemId,
        target,
        current: { sku: savedSku || null, stock: savedStock, price: savedPrice },
        draft: { sku: nextSku, stock: savedStock, price: savedPrice },
      });
      if (!result.ok || result.confirmed.sku !== nextSku) {
        rollbackSku(result.ok ? "No se pudo confirmar el nuevo SKU." : result.message);
        return;
      }
      setSku(nextSku);
      setSavedSku(nextSku);
      await onChanged?.();
      showSaved("sku");
    } catch {
      rollbackSku("No se pudo actualizar el SKU.");
    } finally {
      setSavingField(null);
    }
  }

  async function saveStock() {
    const nextStock = stock;
    if (savingField || nextStock === savedStock) return;
    if (nextStock === null || !Number.isInteger(nextStock) || nextStock < 0) {
      rollbackStock("El stock debe ser un entero mayor o igual a cero.");
      return;
    }

    setSavingField("stock");
    setSavedField(null);
    try {
      const result = await onSave({
        publicationId: publication.itemId,
        target,
        current: { sku: savedSku || null, stock: savedStock, price: savedPrice },
        draft: { sku: savedSku || null, stock: nextStock, price: savedPrice },
      });
      if (!result.ok || result.confirmed.stock !== nextStock) {
        rollbackStock(result.ok ? "No se pudo confirmar el nuevo stock." : result.message);
        return;
      }
      setSavedStock(nextStock);
      await onChanged?.();
      showSaved("stock");
    } catch {
      rollbackStock("No se pudo actualizar el stock.");
    } finally {
      setSavingField(null);
    }
  }

  function rollbackSku(error: string) {
    setSku(savedSku);
    messageApi.error(error);
  }

  function rollbackStock(error: string) {
    setStock(savedStock);
    messageApi.error(error);
  }

  function showSaved(field: "sku" | "stock" | "price") {
    setSavedField(field);
    window.setTimeout(() => setSavedField(null), 1400);
  }

  async function savePrice() {
    const nextPrice = price;
    if (savingField || nextPrice === savedPrice) return;
    if (nextPrice === null || !Number.isFinite(nextPrice) || nextPrice <= 0) { setPrice(savedPrice); messageApi.error("El precio debe ser mayor a cero."); return; }
    setSavingField("price"); setSavedField(null);
    try {
      const result = await onSave({ publicationId: publication.itemId, target, current: { sku: savedSku || null, stock: savedStock, price: savedPrice }, draft: { sku: savedSku || null, stock: savedStock, price: nextPrice } });
      if (!result.ok || result.confirmed.price !== nextPrice) { setPrice(savedPrice); messageApi.error(result.ok ? "No se pudo confirmar el nuevo precio." : result.message); return; }
      setSavedPrice(nextPrice); await onChanged?.(); showSaved("price");
    } catch { setPrice(savedPrice); messageApi.error("No se pudo actualizar el precio."); } finally { setSavingField(null); }
  }

  async function copyMla() {
    await navigator.clipboard.writeText(publication.itemId);
    messageApi.success("MLA copiado");
  }

  async function copyFamilyId() {
    if (!publication.familyId) return;
    await navigator.clipboard.writeText(publication.familyId);
    messageApi.success("Family ID copiado");
  }

  function generateSku() {
    const generatedSku = generatePublicationSku(publication);
    if (!generatedSku) {
      messageApi.warning("No pudimos generar un SKU con este tÃ­tulo.");
      return;
    }
    setSku(generatedSku);
    setSavedField(null);
  }

  return (
    <Card className={styles.childCard} size="small">
      {contextHolder}
      <div className={styles.publicationCardLayout}>
        <div className={styles.publicationInfo}>
          <div className={styles.identityLayout}>
            <WorkspaceThumbnail publication={publication} />
        <div className={styles.childIdentity}>
          <Space size={4}>
            <Typography.Text type="secondary">MLA:</Typography.Text>
            <Typography.Text strong>{publication.itemId}</Typography.Text>
            <Button aria-label={`Copiar MLA ${publication.itemId}`} icon={<CopyOutlined />} onClick={() => void copyMla()} size="small" type="text" />
          </Space>
          {showFamilyId && publication.familyId ? (
            <Space size={4}>
              <Typography.Text type="secondary">Family ID:</Typography.Text>
              <Typography.Text strong>{publication.familyId}</Typography.Text>
              <Button aria-label={`Copiar Family ID ${publication.familyId}`} icon={<CopyOutlined />} onClick={() => void copyFamilyId()} size="small" type="text" />
            </Space>
          ) : null}
          <EditableWorkspaceTitle
            initialTitle={publication.title}
            onSave={onTitleSave}
            showSize
            target={titleTarget}
          />
          <Space size="small" wrap>
            <PublicationStatusTag status={status} />
            {savedStock === 0 ? <Tag color="gold">Sin stock</Tag> : null}
            <Switch
              aria-label={`Estado de ${publication.itemId}`}
              checked={status === "active"}
              disabled={statusSaving || (status !== "active" && status !== "paused")}
              loading={statusSaving}
              onChange={async (checked) => {
                const nextStatus = checked ? "active" : "paused";
                setStatusSaving(true);
                try {
                  const result = await onStatusChange({ publicationId: publication.itemId, target, status: nextStatus });
                  if (result.ok) {
                    setStatus(result.confirmed);
                    await onChanged?.();
                  } else messageApi.error(result.message);
                } finally {
                  setStatusSaving(false);
                }
              }}
            />
          </Space>
          {titlePresentation.size ? (
            <div>
              <PublicationSizeTag size={titlePresentation.size} />
            </div>
          ) : null}
        </div>
          </div>
        <div className={styles.commercialDetails}>
          <CommercialDetail
            label={savedPrice === publication.price ? "Precio" : "Precio base"}
            value={formatPrice(savedPrice, publication.currency)}
          />
          {savedPrice !== publication.price ? <CommercialDetail label="Precio actual" value={formatPrice(publication.price, publication.currency)} /> : null}
          <CommercialDetail
            label="Precio en cuotas"
            value={publication.installmentLabel ?? "No informado"}
          />
          <CommercialDetail
            label="Promoción"
            value={promotionLabel(publication)}
          />
          <CommercialDetail label="Vendidos" value={String(publication.sold)} />
        </div>
        </div>
        <div className={styles.quickEditColumn}>
          <div className={styles.quickEdit}>
            <Typography.Text strong>Edición rápida</Typography.Text>
            <div className={styles.editorFields}>
              <label className={`${styles.editorField} ${styles.priceField}`}>
                <span>Precio</span>
                <span className={styles.autoSaveField}>
                  <InputNumber aria-label={`Precio de ${publication.itemId}`} disabled={savingField === "price"} min={0.01} value={price} onBlur={() => void savePrice()} onChange={setPrice} />
                  <SaveIndicator field="price" savedField={savedField} savingField={savingField} />
                </span>
              </label>
              <label className={`${styles.editorField} ${styles.stockField}`}>
                <span>Stock</span>
                <span className={styles.autoSaveField}>
                  <InputNumber aria-label={`Stock de ${publication.itemId}`} disabled={savingField === "stock"} min={0} precision={0} value={stock} onBlur={() => void saveStock()} onChange={setStock} />
                  <SaveIndicator field="stock" savedField={savedField} savingField={savingField} />
                </span>
              </label>
              <label className={`${styles.editorField} ${styles.skuField}`}>
                <span>SKU</span>
                <span className={styles.skuRow}>
                  <Input className={styles.skuInput} aria-label={`SKU de ${publication.itemId}`} disabled={savingField === "sku"} value={sku} onBlur={() => void saveSku()} onChange={(event) => setSku(event.target.value)} />
                  <Button className={styles.skuButton} disabled={savingField === "sku"} onClick={generateSku} onMouseDown={(event) => event.preventDefault()} size="small">Generar SKU</Button>
                  <SaveIndicator field="sku" savedField={savedField} savingField={savingField} />
                </span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

function CommercialDetail({ label, value }: Readonly<{ label: string; value: string }>) {
  return (
    <span className={styles.commercialDetail}>
      <Typography.Text type="secondary">{label}</Typography.Text>
      <Typography.Text strong>{value}</Typography.Text>
    </span>
  );
}

function promotionLabel(publication: PublicationWorkspaceItem): string {
  if (!publication.hasActivePromotion) return "Sin promoción";
  return publication.promotionDiscountPercent && publication.promotionDiscountPercent > 0
    ? `${publication.promotionDiscountPercent}% OFF`
    : "Promoción activa";
}

function formatPrice(value: number | null, currency: string | null): string {
  if (value === null) return "Sin información";
  try {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: currency ?? "ARS",
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return String(value);
  }
}

export function EditableWorkspaceTitle({ initialTitle, onSave, showSize = false, target }: Readonly<{
  initialTitle: string;
  onSave: WorkspaceTitleAction;
  showSize?: boolean;
  target?: WorkspaceTitleTarget;
}>) {
  const [messageApi, contextHolder] = message.useMessage();
  const [title, setTitle] = useState(initialTitle);
  const [draft, setDraft] = useState(initialTitle);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  async function saveTitle() {
    if (!target || saving) return;
    const nextTitle = draft.trim();
    if (nextTitle === title) return setEditing(false);
    if (!nextTitle) {
      setDraft(title);
      setEditing(false);
      messageApi.error("El título no puede quedar vacío.");
      return;
    }

    setSaving(true);
    try {
      const result = await onSave({ target, title: nextTitle });
      if (!result.ok) {
        setDraft(title);
        messageApi.error(result.message);
      } else {
        setTitle(result.title);
        setDraft(result.title);
      }
    } catch {
      setDraft(title);
      messageApi.error("No se pudo actualizar el título.");
    } finally {
      setSaving(false);
      setEditing(false);
    }
  }

  const visibleTitle = target ? title : initialTitle;
  const titlePresentation = showSize
    ? publicationTitlePresentation(visibleTitle)
    : { title: visibleTitle, size: null };
  const titleContent = (
    <Typography.Text ellipsis>{titlePresentation.title}</Typography.Text>
  );

  if (!target) return titleContent;
  if (editing) {
    return <>{contextHolder}<Input autoFocus aria-label="Editar título" disabled={saving} value={draft} onBlur={() => void saveTitle()} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setDraft(title);
        setEditing(false);
      }
    }} onPressEnter={(event) => event.currentTarget.blur()} /></>;
  }
  return <>{contextHolder}<Space size={4} wrap>{titleContent}<Button aria-label="Editar título" icon={<EditOutlined />} onClick={() => setEditing(true)} size="small" type="text" /></Space></>;
}

function SaveIndicator({ field, savedField, savingField }: Readonly<{ field: "sku" | "stock" | "price"; savedField: "sku" | "stock" | "price" | null; savingField: "sku" | "stock" | "price" | null }>) {
  if (savingField === field) return <Typography.Text type="secondary"><LoadingOutlined spin /> Guardando...</Typography.Text>;
  return savedField === field ? <CheckOutlined aria-label={`${field} guardado`} className={styles.savedIndicator} /> : null;
}

function WorkspaceThumbnail({ publication }: Readonly<{ publication: PublicationWorkspaceItem }>) {
  if (!publication.thumbnailUrl) return <span className={styles.childImagePlaceholder}><PictureOutlined /></span>;
  return <Image alt={publication.title} className={styles.childImage} preview={{ src: publication.imageUrl ?? publication.thumbnailUrl }} src={publication.thumbnailUrl} />;
}

function editTarget(publication: PublicationWorkspaceItem): PublicationEditTarget {
  return publication.familyId ? { type: "family", familyId: publication.familyId, itemId: publication.itemId } : { type: "legacy", itemId: publication.itemId, variationId: null };
}

function PublicationStatusTag({ status }: Readonly<{ status: string }>) {
  const normalizedStatus = status.toLowerCase();
  if (normalizedStatus === "active" || normalizedStatus === "activa") {
    return <Tag color="green">Activa</Tag>;
  }
  if (
    normalizedStatus === "inactive"
    || normalizedStatus === "inactiva"
    || normalizedStatus === "closed"
  ) {
    return <Tag color="red">Inactiva</Tag>;
  }
  if (normalizedStatus === "paused" || normalizedStatus === "pausada") {
    return <Tag color="default">Pausada</Tag>;
  }
  return <Tag color="default">{status}</Tag>;
}
