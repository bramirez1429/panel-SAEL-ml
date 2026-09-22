"use client";

import { CopyOutlined } from "@ant-design/icons";
import { Button, Checkbox, Empty, Flex, Input, Space, Tag, Typography, message } from "antd";
import { useMemo, useState, type MouseEvent } from "react";

import { getPublicationFormatLabel } from "../application/bulk-stock-format";
import { matchesBulkStockSearch, normalizeSearchText } from "../application/bulk-stock-search";
import { getBulkStockProductTypeLabel } from "../bulk-stock.config";
import type { BulkStockPreview, BulkStockProductType, BulkStockVariant } from "../domain/bulk-stock.model";
import { BulkStockSummary } from "./bulk-stock-summary.client";

type BulkStockPreviewProps = Readonly<{
  preview: BulkStockPreview;
  productType?: BulkStockProductType;
  selectedKeys: ReadonlySet<string>;
  submitting: boolean;
  onBack: () => void;
  onSelectionChange: (keys: ReadonlySet<string>) => void;
  onSubmit: () => void;
}>;

export function BulkStockPreviewView({
  preview,
  productType,
  selectedKeys,
  submitting,
  onBack,
  onSelectionChange,
  onSubmit,
}: BulkStockPreviewProps) {
  const [search, setSearch] = useState("");
  const [messageApi, contextHolder] = message.useMessage();
  const normalizedSearch = useMemo(() => normalizeSearchText(search), [search]);
  const visibleVariants = useMemo(
    () => normalizedSearch
      ? preview.variants.filter((variant) => matchesBulkStockSearch(variant, normalizedSearch))
      : preview.variants,
    [normalizedSearch, preview.variants],
  );
  const allEligible = useMemo(() => preview.variants.filter(isSelectable), [preview.variants]);
  const visibleEligible = useMemo(() => visibleVariants.filter(isSelectable), [visibleVariants]);
  const selectedEligible = useMemo(
    () => allEligible.filter((variant) => selectedKeys.has(variant.key)),
    [allEligible, selectedKeys],
  );
  const selectedVisible = useMemo(
    () => visibleEligible.filter((variant) => selectedKeys.has(variant.key)),
    [selectedKeys, visibleEligible],
  );
  const allVisibleSelected = visibleEligible.length > 0 && selectedVisible.length === visibleEligible.length;
  const indeterminate = selectedVisible.length > 0 && !allVisibleSelected;

  const toggleAll = (checked: boolean) => {
    const next = new Set(selectedKeys);
    for (const variant of visibleEligible) {
      if (checked) next.add(variant.key);
      else next.delete(variant.key);
    }
    onSelectionChange(next);
  };

  const toggleVariant = (variant: BulkStockVariant, checked: boolean) => {
    const next = new Set(selectedKeys);
    if (checked) next.add(variant.key);
    else next.delete(variant.key);
    onSelectionChange(next);
  };

  return (
    <Flex vertical gap={12} style={{ flex: "1 1 auto", minHeight: 0 }}>
      {contextHolder}
      <BulkStockSummary summary={preview.summary} />
      {productType ? (
        <Typography.Text strong>
          Producto: {getBulkStockProductTypeLabel(productType)}
        </Typography.Text>
      ) : null}
      <Flex align="center" gap={12} wrap>
        <Input.Search
          allowClear
          aria-label="Buscar variantes"
          placeholder="Buscar por publicación, diseño, color, talle o ID…"
          style={{ flex: "1 1 360px", minWidth: 220 }}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <Typography.Text type="secondary" style={{ whiteSpace: "nowrap" }}>
          {normalizedSearch
            ? `${visibleVariants.length} de ${preview.variants.length} variantes`
            : `${preview.variants.length} variantes`}
        </Typography.Text>
      </Flex>
      <Checkbox
        aria-label="Seleccionar todos los modificables"
        aria-checked={indeterminate ? "mixed" : allVisibleSelected}
        checked={allVisibleSelected}
        disabled={visibleEligible.length === 0}
        indeterminate={indeterminate}
        onChange={(event) => toggleAll(event.target.checked)}
      >
        Seleccionar todos los modificables
      </Checkbox>

      <div
        role="list"
        style={{
          flex: "1 1 auto",
          minHeight: 0,
          overflowY: "auto",
          border: "1px solid #d9d9d9",
          borderRadius: 8,
        }}
      >
        {preview.variants.length === 0 ? (
          <Empty description="No se encontraron variantes" style={{ marginBlock: 48 }} />
        ) : visibleVariants.length === 0 ? (
          <Empty
            description="No encontramos variantes para esta búsqueda"
            style={{ marginBlock: 48 }}
          >
            <Button onClick={() => setSearch("")}>Limpiar búsqueda</Button>
          </Empty>
        ) : visibleVariants.map((variant) => {
          const selectable = isSelectable(variant);
          return (
            <div
              key={variant.key}
              role="listitem"
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 10,
                minWidth: 0,
                padding: "10px 12px",
                borderBottom: "1px solid #f0f0f0",
                opacity: selectable ? 1 : 0.65,
              }}
            >
              <Checkbox
                aria-label={`Seleccionar ${variantLabel(variant)}`}
                checked={selectable && selectedKeys.has(variant.key)}
                disabled={!selectable}
                onChange={(event) => toggleVariant(variant, event.target.checked)}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <Flex align="center" gap={6} wrap>
                  <Typography.Text strong>{variantLabel(variant)}</Typography.Text>
                  <Tag color={selectable ? "blue" : undefined} variant="filled">
                    {getPublicationFormatLabel(variant.model)}
                  </Tag>
                </Flex>
                <Typography.Text type="secondary" style={{ display: "block", fontSize: 12 }}>
                  {variant.color ? `${variant.color} · ` : ""}Talle {variant.size}
                </Typography.Text>
                <Flex gap={12} wrap>
                  <Typography.Text type="secondary">Stock actual: {variant.currentStock}</Typography.Text>
                  <Typography.Text type="secondary">Nuevo stock: {variant.newStock}</Typography.Text>
                  <Typography.Text type="secondary">Estado: {displayStatus(variant)}</Typography.Text>
                </Flex>
                <IdentifierList variant={variant} onCopy={(value, event) => void copyIdentifier(value, event, messageApi)} />
              </div>
            </div>
          );
        })}
      </div>

      <Flex gap={12} justify="space-between" wrap>
        <Button disabled={submitting} onClick={onBack}>Volver</Button>
        <Button
          disabled={selectedEligible.length === 0}
          loading={submitting}
          onClick={onSubmit}
          type="primary"
        >
          Aplicar cambios a {selectedEligible.length} variantes
        </Button>
      </Flex>
    </Flex>
  );
}

export function isSelectable(variant: BulkStockVariant): boolean {
  return variant.needsChange && variant.editable;
}

function IdentifierList({
  variant,
  onCopy,
}: Readonly<{
  variant: BulkStockVariant;
  onCopy: (value: string, event: MouseEvent<HTMLElement>) => void;
}>) {
  return (
    <Space wrap size={[12, 2]} style={{ marginTop: 4 }}>
      <CopyableIdentifier label="ID ML" value={variant.itemId} onCopy={onCopy} />
      {variant.variationId ? <CopyableIdentifier label="ID variante" value={variant.variationId} onCopy={onCopy} /> : null}
      {variant.userProductId ? <CopyableIdentifier label="ID producto" value={variant.userProductId} onCopy={onCopy} /> : null}
      {variant.familyId ? <Typography.Text type="secondary">Familia: {variant.familyId}</Typography.Text> : null}
    </Space>
  );
}

function CopyableIdentifier({
  label,
  value,
  onCopy,
}: Readonly<{
  label: string;
  value: string;
  onCopy: (value: string, event: MouseEvent<HTMLElement>) => void;
}>) {
  return (
    <Typography.Text type="secondary" style={{ fontSize: 12, wordBreak: "break-all" }}>
      {label}: {value}
      <Button
        aria-label={`Copiar ${label} ${value}`}
        icon={<CopyOutlined />}
        size="small"
        type="text"
        onClick={(event) => onCopy(value, event)}
      />
    </Typography.Text>
  );
}

async function copyIdentifier(
  value: string,
  event: MouseEvent<HTMLElement>,
  messageApi: ReturnType<typeof message.useMessage>[0],
) {
  event.stopPropagation();
  if (!navigator.clipboard) {
    messageApi.error("No se pudo copiar el ID");
    return;
  }
  try {
    await navigator.clipboard.writeText(value);
    messageApi.success("ID copiado");
  } catch {
    messageApi.error("No se pudo copiar el ID");
  }
}

function variantLabel(variant: BulkStockVariant): string {
  return [variant.title, variant.color, variant.size].filter(Boolean).join(" / ");
}

function displayStatus(variant: BulkStockVariant): string {
  if (!variant.needsChange) return "Sin cambios";
  if (variant.currentStock === 0) return "Sin stock";
  return variant.status;
}
