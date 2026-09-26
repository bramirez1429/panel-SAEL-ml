"use client";

import {
  CheckOutlined,
  CopyOutlined,
  EditOutlined,
  LoadingOutlined,
  PictureOutlined,
} from "@ant-design/icons";
import { Button, Card, Image, Input, InputNumber, message, Space, Switch, Typography } from "antd";
import { useState } from "react";

import type { UpdatePublicationInput } from "@/modules/publications/application/update-publication.command";
import type { PublicationEditStatus, PublicationEditTarget } from "@/modules/publications/domain/publication-edit.repository";

import type { PublicationWorkspaceItem } from "../domain/publication-workspace.model";
import styles from "./publication-promotion-workspace.module.css";

export type WorkspaceSaveAction = (input: UpdatePublicationInput) => Promise<
  | Readonly<{ ok: true; confirmed: Readonly<{ sku?: string | null; stock?: number | null }> }>
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
}>) => Promise<Readonly<{ ok: true; title: string } | { ok: false; message: string }>>;

type Props = Readonly<{
  publication: PublicationWorkspaceItem;
  onSave: WorkspaceSaveAction;
  onStatusChange: WorkspaceStatusAction;
  onTitleSave: WorkspaceTitleAction;
  titleTarget?: WorkspaceTitleTarget;
}>;

export function PublicationWorkspaceEditor({ publication, onSave, onStatusChange, onTitleSave, titleTarget }: Props) {
  const [messageApi, contextHolder] = message.useMessage();
  const [sku, setSku] = useState(publication.sku ?? "");
  const [stock, setStock] = useState<number | null>(publication.stock);
  const [savedSku, setSavedSku] = useState(publication.sku ?? "");
  const [savedStock, setSavedStock] = useState(publication.stock);
  const [savingField, setSavingField] = useState<"sku" | "stock" | null>(null);
  const [savedField, setSavedField] = useState<"sku" | "stock" | null>(null);
  const [status, setStatus] = useState(publication.status);
  const [statusSaving, setStatusSaving] = useState(false);
  const [showLargeImage, setShowLargeImage] = useState(false);
  const target = editTarget(publication);

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
        current: { sku: savedSku || null, stock: savedStock, price: publication.price },
        draft: { sku: nextSku, stock: savedStock, price: publication.price },
      });
      if (!result.ok || result.confirmed.sku !== nextSku) {
        rollbackSku(result.ok ? "No se pudo confirmar el nuevo SKU." : result.message);
        return;
      }
      setSku(nextSku);
      setSavedSku(nextSku);
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
        current: { sku: savedSku || null, stock: savedStock, price: publication.price },
        draft: { sku: savedSku || null, stock: nextStock, price: publication.price },
      });
      if (!result.ok || result.confirmed.stock !== nextStock) {
        rollbackStock(result.ok ? "No se pudo confirmar el nuevo stock." : result.message);
        return;
      }
      setSavedStock(nextStock);
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

  function showSaved(field: "sku" | "stock") {
    setSavedField(field);
    window.setTimeout(() => setSavedField(null), 1400);
  }

  async function copyMla() {
    await navigator.clipboard.writeText(publication.itemId);
    messageApi.success("MLA copiado");
  }

  return (
    <Card className={styles.childCard} size="small">
      {contextHolder}
      <div className={styles.childLayout}>
        <WorkspaceThumbnail publication={publication} />
        <div className={styles.childIdentity}>
          <Space size={4}>
            <Typography.Text type="secondary">MLA:</Typography.Text>
            <Typography.Text strong>{publication.itemId}</Typography.Text>
            <Button aria-label={`Copiar MLA ${publication.itemId}`} icon={<CopyOutlined />} onClick={() => void copyMla()} size="small" type="text" />
          </Space>
          <EditableWorkspaceTitle
            initialTitle={publication.title}
            onSave={onTitleSave}
            target={titleTarget}
          />
          <Space size="small">
            <Typography.Text type="secondary">Estado: {statusLabel(status)}</Typography.Text>
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
                  if (result.ok) setStatus(result.confirmed);
                  else messageApi.error(result.message);
                } finally {
                  setStatusSaving(false);
                }
              }}
            />
          </Space>
        </div>
        <label className={styles.editorField}>
          <span>SKU</span>
          <span className={styles.autoSaveField}>
            <Input aria-label={`SKU de ${publication.itemId}`} disabled={savingField === "sku"} value={sku} onBlur={() => void saveSku()} onChange={(event) => setSku(event.target.value)} />
            <SaveIndicator field="sku" savedField={savedField} savingField={savingField} />
          </span>
        </label>
        <label className={styles.editorField}>
          <span>Stock</span>
          <span className={styles.autoSaveField}>
            <InputNumber aria-label={`Stock de ${publication.itemId}`} disabled={savingField === "stock"} min={0} precision={0} value={stock} onBlur={() => void saveStock()} onChange={setStock} />
            <SaveIndicator field="stock" savedField={savedField} savingField={savingField} />
          </span>
        </label>
        <Space className={styles.childActions} wrap>
          {publication.imageUrl && <Button onClick={() => setShowLargeImage((visible) => !visible)}>{showLargeImage ? "Ocultar imagen" : "Ver imagen"}</Button>}
        </Space>
      </div>
      {showLargeImage && publication.imageUrl && <div className={styles.expandedImage}><Image alt={publication.title} className={styles.image} preview={{ src: publication.imageUrl }} src={publication.imageUrl} /></div>}
    </Card>
  );
}

export function EditableWorkspaceTitle({ initialTitle, onSave, target }: Readonly<{
  initialTitle: string;
  onSave: WorkspaceTitleAction;
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

  if (!target) return <Typography.Text ellipsis>{title}</Typography.Text>;
  if (editing) {
    return <>{contextHolder}<Input autoFocus aria-label="Editar título" disabled={saving} value={draft} onBlur={() => void saveTitle()} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setDraft(title);
        setEditing(false);
      }
    }} onPressEnter={(event) => event.currentTarget.blur()} /></>;
  }
  return <>{contextHolder}<Space size={4}><Typography.Text ellipsis>{title}</Typography.Text><Button aria-label="Editar título" icon={<EditOutlined />} onClick={() => setEditing(true)} size="small" type="text" /></Space></>;
}

function SaveIndicator({ field, savedField, savingField }: Readonly<{ field: "sku" | "stock"; savedField: "sku" | "stock" | null; savingField: "sku" | "stock" | null }>) {
  if (savingField === field) return <Typography.Text type="secondary"><LoadingOutlined spin /> Guardando...</Typography.Text>;
  return savedField === field ? <CheckOutlined aria-label={`${field} guardado`} className={styles.savedIndicator} /> : null;
}

function WorkspaceThumbnail({ publication }: Readonly<{ publication: PublicationWorkspaceItem }>) {
  if (!publication.thumbnailUrl) return <span className={styles.childImagePlaceholder}><PictureOutlined /></span>;
  return <Image alt={publication.title} className={styles.childImage} preview={false} src={publication.thumbnailUrl} />;
}

function editTarget(publication: PublicationWorkspaceItem): PublicationEditTarget {
  return publication.familyId ? { type: "family", familyId: publication.familyId, itemId: publication.itemId } : { type: "legacy", itemId: publication.itemId, variationId: null };
}

function statusLabel(status: string): string {
  if (status === "active") return "Activa";
  if (status === "paused") return "Pausada";
  return status;
}
