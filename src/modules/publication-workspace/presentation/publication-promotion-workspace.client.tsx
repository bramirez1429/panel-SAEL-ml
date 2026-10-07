"use client";

import { CheckOutlined, EditOutlined, LoadingOutlined, PictureOutlined } from "@ant-design/icons";
import { Button, Card, Divider, Image, Input, InputNumber, List, Modal, Progress, Space, Tabs, Typography, message } from "antd";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { parsePublicationSearch } from "@/shared/lib/publication-search";
import {
  applyPublicationVisualOrder,
  createPublicationVisualOrder,
  extendPublicationVisualOrder,
  groupPublicationsByVariant,
  type PublicationVisualOrder,
} from "@/shared/lib/publication-variant";
import type {
  TiendanubeCategory,
  TiendanubeReplicationState,
} from "@/modules/tiendanube/domain/tiendanube-replication.model";
import {
  TiendanubeReplicationCell,
  type GetTiendanubeReplicationStateAction,
  type ReplicatePublicationAction,
} from "@/modules/tiendanube/presentation/tiendanube-replication-cell.client";

import type {
  PublicationWorkspaceItem,
  PublicationWorkspaceLegacyVariation,
  PublicationWorkspaceSearchItem,
  PublicationWorkspaceSearchResult,
  PublicationWorkspaceSelection,
  PublicationWorkspaceSelectionRequest,
  PublicationWorkspaceSelectionResult,
} from "../domain/publication-workspace.model";
import { compareSizes } from "@/modules/publications/presentation/publication-variant-row";
import { generatePublicationSku } from "@/shared/lib/publication-sku";
import {
  EditableWorkspaceTitle,
  PublicationWorkspaceEditor,
  type GetTiendanubeProductByMlAction,
  type WorkspaceSaveAction,
  type WorkspaceStatusAction,
  type WorkspaceTitleAction,
} from "./publication-workspace-editor.client";
import { PublicationWorkspacePromotions } from "./publication-workspace-promotions.client";
import styles from "./publication-promotion-workspace.module.css";

type Props = Readonly<{
  onSearch(term: string): Promise<PublicationWorkspaceSearchResult>;
  onSelect(request: PublicationWorkspaceSelectionRequest): Promise<PublicationWorkspaceSelectionResult>;
  onSave: WorkspaceSaveAction;
  onStatusChange: WorkspaceStatusAction;
  onTitleSave: WorkspaceTitleAction;
  getTiendanubeStateAction?: GetTiendanubeReplicationStateAction;
  getTiendanubeProductByMlAction?: GetTiendanubeProductByMlAction;
  replicateTiendanubeAction?: ReplicatePublicationAction;
  tiendanubeCategories?: readonly TiendanubeCategory[];
}>;

type ViewState = "initial" | "searching" | "results" | "empty" | "error" | "selected";

export function PublicationPromotionWorkspace({
  getTiendanubeStateAction,
  getTiendanubeProductByMlAction,
  onSearch,
  onSelect,
  onSave,
  onStatusChange,
  onTitleSave,
  replicateTiendanubeAction,
  tiendanubeCategories = [],
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const hydratedSearchRef = useRef(false);
  const selectionRequestRef = useRef<PublicationWorkspaceSelectionRequest | null>(null);
  const [query, setQuery] = useState("");
  const [selection, setSelection] = useState<PublicationWorkspaceSelection | null>(null);
  const [visualOrder, setVisualOrder] = useState<PublicationVisualOrder>({});
  const [matches, setMatches] = useState<readonly PublicationWorkspaceSearchItem[]>([]);
  const [viewState, setViewState] = useState<ViewState>("initial");
  const criteria = parsePublicationSearch(query);

  async function handleSearch(rawTerm: string) {
    const criteria = parsePublicationSearch(rawTerm);
    if (!criteria) return;

    setQuery(criteria.value);
    replaceSearchQuery(criteria.value);
    await executeSearch(criteria.value);
  }

  function replaceSearchQuery(value: string | null): void {
    const params = new URLSearchParams(searchParams.toString());

    if (value) {
      params.set("q", value);
    } else {
      params.delete("q");
    }

    const serializedParams = params.toString();
    router.replace(
      `/publicacion-promocion${serializedParams ? `?${serializedParams}` : ""}`,
      { scroll: false },
    );
  }

  async function executeSearch(rawTerm: string) {
    const criteria = parsePublicationSearch(rawTerm);
    if (!criteria) return;

    setViewState("searching");
    setSelection(null);
    setMatches([]);

    try {
      const result = await onSearch(criteria.value);
      if (result.status === "error") return setViewState("error");
      if (result.items.length === 0) {
        setViewState("empty");
        return;
      }
      if (result.searchType === "FAMILY" || result.searchType === "MLAU") {
        const familyId = result.searchType === "FAMILY"
          ? result.query
          : result.items[0]?.familyId;
        if (!familyId) return setViewState("empty");
        await loadSelection({
          familyId,
          itemIds: result.items.map(({ itemId }) => itemId),
        });
        return;
      }
      if (result.searchType === "TITLE" && result.items.length > 1) {
        setMatches(result.items);
        setViewState("results");
        return;
      }
      const [firstItem] = result.items;
      if (!firstItem) return;
      await loadSelection({ itemId: firstItem.itemId });
    } catch {
      setViewState("error");
    }
  }

  useEffect(() => {
    if (hydratedSearchRef.current) return;
    hydratedSearchRef.current = true;

    const urlQuery = searchParams.get("q")?.trim();
    if (!urlQuery) return;

    const criteria = parsePublicationSearch(urlQuery);
    if (!criteria) return;

    setQuery(criteria.value);
    void executeSearch(criteria.value);
    // La URL solo hidrata la búsqueda inicial; router.replace no debe repetirla.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadSelection(request: PublicationWorkspaceSelectionRequest) {
    selectionRequestRef.current = request;
    setViewState("searching");
    try {
      const result = await onSelect(request);
      if (result.status === "error") return setViewState("error");
      setVisualOrder(createPublicationVisualOrder(selectionPublications(result.selection)));
      setSelection(result.selection);
      setMatches([]);
      setViewState("selected");
    } catch {
      setViewState("error");
    }
  }

  async function refreshCurrentSelection(): Promise<void> {
    const request = selectionRequestRef.current;
    if (!request) return;

    try {
      const result = await onSelect(request);
      if (result.status === "error") return;
      if (selectionRequestRef.current !== request) return;
      setVisualOrder((currentOrder) =>
        extendPublicationVisualOrder(currentOrder, selectionPublications(result.selection)),
      );
      setSelection(result.selection);
    } catch {
      // La operación ya fue confirmada; conservamos el estado optimista si falla el refresh.
    }
  }

  const handleTitleSave: WorkspaceTitleAction = async (input) => {
    const result = await onTitleSave(input);
    if (result.ok) {
      if (result.family) setSelection(result.family);
      await refreshCurrentSelection();
    }
    return result;
  };

  return (
    <main className={styles.page}>
      <section className={styles.searchSection}>
        <Typography.Title className={styles.title} level={2}>Publicación y promoción</Typography.Title>
        <Typography.Paragraph className={styles.description}>
          Buscá una publicación para trabajar sobre sus datos y promociones.
        </Typography.Paragraph>
        <Input.Search
          allowClear
          aria-label="Buscar publicación"
          enterButton="Buscar"
          loading={viewState === "searching"}
          onChange={(event) => {
            const nextQuery = event.target.value;
            setQuery(nextQuery);

            if (!nextQuery) {
              replaceSearchQuery(null);
            }
          }}
          onSearch={handleSearch}
          placeholder="Buscar por MLA, MLAU, Family ID o nombre"
          size="large"
          value={query}
        />
        <Typography.Text className={styles.searchType} type="secondary">
          {criteria ? searchTypeLabel(criteria.type) : "MLA · MLAU · Familia · Nombre"}
        </Typography.Text>
      </section>

      {viewState === "initial" && <WorkspaceMessage>Buscá una publicación para comenzar.</WorkspaceMessage>}
      {viewState === "searching" && <WorkspaceMessage>Consultando publicación...</WorkspaceMessage>}
      {viewState === "empty" && <WorkspaceMessage>No encontramos publicaciones.</WorkspaceMessage>}
      {viewState === "error" && <WorkspaceMessage>No pudimos consultar la publicación.</WorkspaceMessage>}
      {viewState === "results" && <PublicationMatches items={matches} onSelect={(item) => loadSelection({ itemId: item.itemId })} />}
      {viewState === "selected" && selection && (
        <WorkspaceTabs
          selection={selection}
          visualOrder={visualOrder}
          getTiendanubeStateAction={getTiendanubeStateAction}
          getTiendanubeProductByMlAction={getTiendanubeProductByMlAction}
          onChanged={refreshCurrentSelection}
          onSave={onSave}
          onStatusChange={onStatusChange}
          onTitleSave={handleTitleSave}
          replicateTiendanubeAction={replicateTiendanubeAction}
          tiendanubeCategories={tiendanubeCategories}
        />
      )}
    </main>
  );
}

function searchTypeLabel(type: "FAMILY" | "MLA" | "MLAU" | "TITLE"): string {
  if (type === "FAMILY") return "Búsqueda por familia";
  if (type === "MLA") return "Búsqueda por MLA";
  if (type === "MLAU") return "Búsqueda por User Product";
  return "Búsqueda por nombre";
}

function WorkspaceMessage({ children }: React.PropsWithChildren) {
  return <Typography.Text className={styles.emptyState} type="secondary">{children}</Typography.Text>;
}

function PublicationMatches({ items, onSelect }: Readonly<{
  items: readonly PublicationWorkspaceSearchItem[];
  onSelect(item: PublicationWorkspaceSearchItem): void;
}>) {
  return (
    <section aria-label="Coincidencias de publicaciones">
      <Typography.Title level={4}>Elegí una publicación</Typography.Title>
      <List
        dataSource={[...items]}
        grid={{ gutter: 12, xs: 1, sm: 2, lg: 4 }}
        renderItem={(item) => (
          <List.Item>
            <Button className={styles.matchButton} onClick={() => onSelect(item)} type="text">
              <span className={styles.matchTitle}>{item.title}</span>
              <span>{item.itemId}</span>
              {item.familyId && <span>Family ID: {item.familyId}</span>}
            </Button>
          </List.Item>
        )}
      />
    </section>
  );
}

function WorkspaceTabs({
  selection,
  visualOrder,
  getTiendanubeStateAction,
  getTiendanubeProductByMlAction,
  onChanged,
  onSave,
  onStatusChange,
  onTitleSave,
  replicateTiendanubeAction,
  tiendanubeCategories,
}: Readonly<{
  selection: PublicationWorkspaceSelection;
  visualOrder: PublicationVisualOrder;
  getTiendanubeStateAction?: GetTiendanubeReplicationStateAction;
  getTiendanubeProductByMlAction?: GetTiendanubeProductByMlAction;
  onChanged: () => Promise<void>;
  onSave: WorkspaceSaveAction;
  onStatusChange: WorkspaceStatusAction;
  onTitleSave: WorkspaceTitleAction;
  replicateTiendanubeAction?: ReplicatePublicationAction;
  tiendanubeCategories: readonly TiendanubeCategory[];
}>) {
  const [activeTab, setActiveTab] = useState("publication");
  const [promotionOpened, setPromotionOpened] = useState(false);

  function changeTab(key: string): void {
    setActiveTab(key);
    if (key === "promotion") setPromotionOpened(true);
  }

  return (
    <Tabs
      activeKey={activeTab}
      onChange={changeTab}
      items={[
        {
          key: "publication",
          label: "Publicación",
          children: (
            <PublicationTab
              selection={selection}
              visualOrder={visualOrder}
              getTiendanubeStateAction={getTiendanubeStateAction}
              getTiendanubeProductByMlAction={getTiendanubeProductByMlAction}
              onChanged={onChanged}
              onSave={onSave}
              onStatusChange={onStatusChange}
              onTitleSave={onTitleSave}
              replicateTiendanubeAction={replicateTiendanubeAction}
              tiendanubeCategories={tiendanubeCategories}
            />
          ),
        },
        {
          key: "promotion",
          label: "Promoción",
          children: promotionOpened
            ? <PublicationWorkspacePromotions selection={selection} visualOrder={visualOrder} onChanged={onChanged} />
            : null,
        },
      ]}
    />
  );
}

function PublicationTab({
  selection,
  visualOrder,
  getTiendanubeStateAction,
  getTiendanubeProductByMlAction,
  onChanged,
  onSave,
  onStatusChange,
  onTitleSave,
  replicateTiendanubeAction,
  tiendanubeCategories,
}: Readonly<{
  selection: PublicationWorkspaceSelection;
  visualOrder: PublicationVisualOrder;
  getTiendanubeStateAction?: GetTiendanubeReplicationStateAction;
  getTiendanubeProductByMlAction?: GetTiendanubeProductByMlAction;
  onChanged: () => Promise<void>;
  onSave: WorkspaceSaveAction;
  onStatusChange: WorkspaceStatusAction;
  onTitleSave: WorkspaceTitleAction;
  replicateTiendanubeAction?: ReplicatePublicationAction;
  tiendanubeCategories: readonly TiendanubeCategory[];
}>) {
  const sourceKey = tiendanubeSourceKey(selection);
  const initialState: TiendanubeReplicationState = {
    sourceKey,
    status: "UNKNOWN",
    tiendanubeProductId: null,
  };

  return (
    <>
      {replicateTiendanubeAction && getTiendanubeStateAction ? (
        <div style={{ marginBottom: 16 }}>
          <TiendanubeReplicationCell
            key={sourceKey}
            action={replicateTiendanubeAction}
            categories={tiendanubeCategories}
            getStateAction={getTiendanubeStateAction}
            initialState={initialState}
            sourceKey={sourceKey}
          />
        </div>
      ) : null}
      {selection.type === "family" ? (
        <FamilyWorkspace family={selection} visualOrder={visualOrder} onChanged={onChanged} onSave={onSave} onStatusChange={onStatusChange} onTitleSave={onTitleSave} getTiendanubeProductByMlAction={getTiendanubeProductByMlAction} />
      ) : (
        <div className={styles.publicationSelection}>
          <PublicationWorkspaceEditor
            publication={selection.publication}
            onChanged={onChanged}
            onSave={onSave}
            onStatusChange={onStatusChange}
            onTitleSave={onTitleSave}
            getTiendanubeProductByMlAction={getTiendanubeProductByMlAction}
            showFamilyId
            titleTarget={selection.publication.model === "SHARED" ? { type: "publication", itemId: selection.publication.itemId } : undefined}
          />
          {selection.publication.model === "SHARED" && (selection.publication.legacyVariations?.length ?? 0) > 0 ? (
            <LegacyVariations
              publication={selection.publication}
              onChanged={onChanged}
              onSave={onSave}
            />
          ) : null}
        </div>
      )}
    </>
  );
}

function LegacyVariations({ publication, onChanged, onSave }: Readonly<{
  publication: PublicationWorkspaceItem;
  onChanged: () => Promise<void>;
  onSave: WorkspaceSaveAction;
}>) {
  const groups = new Map<string, typeof variations>();
  const variations = [...(publication.legacyVariations ?? [])];
  for (const variation of variations) {
    const color = variation.color?.trim() || "Sin color";
    const group = groups.get(color) ?? [];
    group.push(variation);
    groups.set(color, group);
  }
  const orderedGroups = [...groups.entries()].sort(([left], [right]) => left.localeCompare(right, "es", { sensitivity: "base" }));

  return (
    <section className={styles.legacyVariations}>
      <Typography.Title level={4}>Variantes de la publicación</Typography.Title>
      {orderedGroups.map(([color, colorVariations]) => {
        const orderedVariations = [...colorVariations].sort((left, right) => compareSizes(left.size, right.size));
        return (
          <div key={color} className={styles.legacyVariationGroup}>
            <Divider className={styles.legacyVariationDivider} titlePlacement="start">{color}</Divider>
            <div className={styles.legacyVariationList}>
              {orderedVariations.map((variation) => (
                <LegacyVariationEditor
                  key={variation.variationId}
                  publicationId={publication.itemId}
                  publicationTitle={publication.title}
                  variation={variation}
                  onChanged={onChanged}
                  onSave={onSave}
                />
              ))}
            </div>
          </div>
        );
      })}
    </section>
  );
}

function LegacyVariationEditor({ publicationId, publicationTitle, variation, onChanged, onSave }: Readonly<{
  publicationId: string;
  publicationTitle: string;
  variation: PublicationWorkspaceLegacyVariation;
  onChanged: () => Promise<void>;
  onSave: WorkspaceSaveAction;
}>) {
  const [messageApi, contextHolder] = message.useMessage();
  const [sku, setSku] = useState(variation.sku ?? "");
  const [stock, setStock] = useState<number | null>(variation.stock);
  const [savedSku, setSavedSku] = useState(variation.sku ?? "");
  const [savedStock, setSavedStock] = useState(variation.stock);
  const [saving, setSaving] = useState<"sku" | "stock" | null>(null);
  const [skuSaved, setSkuSaved] = useState(false);
  const confirmedSkuRef = useRef<string | null>(null);
  const target = { type: "legacy" as const, itemId: publicationId, variationId: variation.variationId };

  useEffect(() => {
    if (saving === "sku") return;
    const confirmedSku = variation.sku ?? "";
    if (confirmedSkuRef.current !== null) {
      if (confirmedSku !== confirmedSkuRef.current) return;
      confirmedSkuRef.current = null;
    }
    setSku(confirmedSku);
    setSavedSku(confirmedSku);
  }, [variation.sku, saving]);

  useEffect(() => {
    if (saving === "stock") return;
    setStock(variation.stock);
    setSavedStock(variation.stock);
  }, [variation.stock, saving]);

  async function saveStock() {
    const nextStock = stock;
    if (saving || nextStock === savedStock) return;
    if (nextStock === null || !Number.isInteger(nextStock) || nextStock < 0) {
      setStock(savedStock);
      messageApi.error("El stock debe ser un entero mayor o igual a cero.");
      return;
    }
    setSaving("stock");
    try {
      const result = await onSave({
        publicationId,
        target,
        current: { sku: savedSku || null, stock: savedStock, price: variation.price },
        draft: { sku: savedSku || null, stock: nextStock, price: variation.price },
      });
      if (!result.ok || result.confirmed.stock !== nextStock) {
        setStock(savedStock);
        messageApi.error(result.ok ? "No se pudo confirmar el nuevo stock." : result.message);
        return;
      }
      setSavedStock(nextStock);
      await onChanged();
    } catch {
      setStock(savedStock);
      messageApi.error("No se pudo actualizar el stock.");
    } finally {
      setSaving(null);
    }
  }

  async function saveSku() {
    const nextSku = sku.trim();
    if (saving || nextSku === savedSku) return;
    if (!nextSku) {
      setSku(savedSku);
      messageApi.error("El SKU no puede quedar vacío.");
      return;
    }
    setSaving("sku");
    setSkuSaved(false);
    try {
      const result = await onSave({
        publicationId,
        target,
        current: { sku: savedSku || null, stock: savedStock, price: variation.price },
        draft: { sku: nextSku, stock: savedStock, price: variation.price },
      });
      if (!result.ok || result.confirmed.sku !== nextSku) {
        setSku(savedSku);
        messageApi.error(result.ok ? "No se pudo confirmar el nuevo SKU." : result.message);
        return;
      }
      setSku(nextSku);
      setSavedSku(nextSku);
      confirmedSkuRef.current = nextSku;
      setSkuSaved(true);
      window.setTimeout(() => setSkuSaved(false), 1400);
      await onChanged();
    } catch {
      setSku(savedSku);
      messageApi.error("No se pudo actualizar el SKU.");
    } finally {
      setSaving(null);
    }
  }

  function generateSku() {
    const nextSku = generatePublicationSku({
      title: publicationTitle,
      attributes: variation.attributes,
      size: variation.size,
    });
    if (nextSku) {
      setSku(nextSku);
      setSkuSaved(false);
    }
    else messageApi.warning("No pudimos generar un SKU con esta variante.");
  }

  return (
    <Card className={styles.legacyVariationCard} size="small">
      {contextHolder}
      {variation.imageUrl ? <Image alt={`Variación ${variation.variationId}`} className={styles.legacyVariationImage} preview={{ src: variation.imageUrl }} src={variation.imageUrl} /> : <span className={styles.legacyVariationImagePlaceholder}>—</span>}
      <div className={styles.legacyVariationDetails}>
        <LegacyVariationDetail label="Talle" value={variation.size ?? "No informado"} />
        <LegacyVariationDetail label="Vendidos" value={variation.sold === null ? "No informado" : String(variation.sold)} />
        <LegacyVariationDetail label="Variation ID" value={String(variation.variationId)} />
      </div>
      <label className={styles.legacyVariationField}>
        <span>Stock</span>
        <InputNumber
          aria-label={`Stock de variación ${variation.variationId}`}
          disabled={saving === "stock"}
          min={0}
          precision={0}
          value={stock}
          onBlur={() => void saveStock()}
          onChange={setStock}
        />
      </label>
      <label className={styles.legacyVariationField}>
        <span>SKU</span>
        <Input
          aria-label={`SKU de variación ${variation.variationId}`}
          disabled={saving === "sku"}
          value={sku}
          onBlur={() => void saveSku()}
          onChange={(event) => { setSku(event.target.value); setSkuSaved(false); }}
        />
        <Button disabled={saving === "sku"} onClick={generateSku} onMouseDown={(event) => event.preventDefault()} size="small">Generar SKU</Button>
        {saving === "sku" ? <Typography.Text type="secondary"><LoadingOutlined spin /> Guardando...</Typography.Text> : skuSaved ? <CheckOutlined className={styles.savedIndicator} /> : null}
      </label>
    </Card>
  );
}

function LegacyVariationDetail({ label, value }: Readonly<{ label: string; value: string }>) {
  return (
    <span className={styles.commercialDetail}>
      <Typography.Text type="secondary">{label}</Typography.Text>
      <Typography.Text strong>{value}</Typography.Text>
    </span>
  );
}

function tiendanubeSourceKey(selection: PublicationWorkspaceSelection): string {
  if (selection.type === "family") return `family:${selection.familyId}`;
  return selection.publication.familyId
    ? `family:${selection.publication.familyId}`
    : `item:${selection.publication.itemId}`;
}

function FamilyWorkspace({ family, visualOrder, onChanged, onSave, onStatusChange, onTitleSave, getTiendanubeProductByMlAction }: Readonly<{
  family: Extract<PublicationWorkspaceSelection, { type: "family" }>;
  visualOrder: PublicationVisualOrder;
  onChanged: () => Promise<void>;
  onSave: WorkspaceSaveAction;
  onStatusChange: WorkspaceStatusAction;
  onTitleSave: WorkspaceTitleAction;
  getTiendanubeProductByMlAction?: GetTiendanubeProductByMlAction;
}>) {
  const [globalOpen, setGlobalOpen] = useState(false);
  const [globalPrice, setGlobalPrice] = useState<number | null>(null);
  const [globalProgress, setGlobalProgress] = useState<{ completed: number; total: number; failures: string[] } | null>(null);
  const [globalApplying, setGlobalApplying] = useState(false);
  const [editingGlobalPrice, setEditingGlobalPrice] = useState(false);
  const globalPriceActionRef = useRef(false);
  const draftGlobalPriceRef = useRef<number | null>(null);
  const [messageApi, contextHolder] = message.useMessage();
  const totalSold = family.children.reduce((total, child) => total + child.sold, 0);
  const variantGroups = applyPublicationVisualOrder(
    groupPublicationsByVariant(family.children),
    visualOrder,
  );
  const familyPrices = family.children.map((child) => child.standardPrice ?? child.price);
  const numericPrices = familyPrices.filter((value): value is number => value !== null && Number.isFinite(value));
  const currentMinPrice = numericPrices.length > 0 ? Math.min(...numericPrices) : null;
  const currentMaxPrice = numericPrices.length > 0 ? Math.max(...numericPrices) : null;
  const hasSingleGlobalPrice = numericPrices.length === familyPrices.length && currentMinPrice === currentMaxPrice;
  const currentGlobalPrice = hasSingleGlobalPrice ? currentMinPrice : null;

  function beginGlobalPriceEdit() {
    if (globalApplying) return;
    setGlobalPrice(currentGlobalPrice);
    draftGlobalPriceRef.current = currentGlobalPrice;
    setEditingGlobalPrice(true);
  }

  async function saveGlobalPrice() {
    if (globalPriceActionRef.current || globalApplying) return;
    globalPriceActionRef.current = true;
    const nextPrice = draftGlobalPriceRef.current;
    if (nextPrice !== null && nextPrice === currentGlobalPrice) {
      setEditingGlobalPrice(false);
      globalPriceActionRef.current = false;
      return;
    }
    if (nextPrice === null || !Number.isFinite(nextPrice) || nextPrice <= 0) {
      messageApi.error("El precio debe ser mayor a cero.");
      setGlobalPrice(currentGlobalPrice);
      draftGlobalPriceRef.current = currentGlobalPrice;
      setEditingGlobalPrice(false);
      globalPriceActionRef.current = false;
      return;
    }
    setGlobalPrice(nextPrice);
    setGlobalProgress(null);
    await applyGlobalPrice(nextPrice);
    globalPriceActionRef.current = false;
  }

  return (
    <section className={styles.familyWorkspace}>
      {contextHolder}
      <Card>
        <div className={styles.familyHeader}>
          {family.imageUrl
            ? <Image alt={family.familyName ?? family.familyId} className={styles.familyImage} preview={false} src={family.imageUrl} />
            : <span className={styles.familyImagePlaceholder}><PictureOutlined /></span>}
          <div>
            <Typography.Text strong>Family ID: {family.familyId}</Typography.Text>
            <div className={styles.familyTitle}>
              <EditableWorkspaceTitle initialTitle={family.familyName ?? `Familia ${family.familyId}`} onSave={onTitleSave} target={{ type: "family", familyId: family.familyId }} />
            </div>
            <div><Typography.Text strong>Total vendidos: {totalSold}</Typography.Text></div>
            <div><Typography.Text type="secondary">Modalidades: </Typography.Text><Typography.Text>{[...new Set(family.children.map((child) => listingTypeLabel(child.listingTypeId)))].join(" · ")}</Typography.Text></div>
            <div>
              <Typography.Text strong>Precio global actual: </Typography.Text>
              {editingGlobalPrice ? (
                <Space size={4}>
                  <InputNumber autoFocus disabled={globalApplying} min={0.01} value={globalPrice} onBlur={() => void saveGlobalPrice()} onChange={(value) => { draftGlobalPriceRef.current = value; setGlobalPrice(value); }} onPressEnter={(event) => event.currentTarget.blur()} onKeyDown={(event) => { if (event.key === "Escape") { event.preventDefault(); globalPriceActionRef.current = true; setGlobalPrice(currentGlobalPrice); draftGlobalPriceRef.current = currentGlobalPrice; setEditingGlobalPrice(false); window.setTimeout(() => { globalPriceActionRef.current = false; }, 0); } }} />
                  {globalApplying ? <LoadingOutlined aria-label="Guardando precio global" spin /> : null}
                </Space>
              ) : (
                <Space size={4}>
                  <Typography.Text>{currentMinPrice === null ? "Sin información" : currentMinPrice === currentMaxPrice ? formatGlobalPrice(currentMinPrice, family.children[0]?.currency) : `${formatGlobalPrice(currentMinPrice, family.children[0]?.currency)} - ${formatGlobalPrice(currentMaxPrice!, family.children[0]?.currency)}`}</Typography.Text>
                  {globalApplying ? <LoadingOutlined aria-label="Guardando precio global" spin /> : <Button aria-label="Editar precio global" disabled={globalApplying} icon={<EditOutlined />} onClick={beginGlobalPriceEdit} size="small" type="text" />}
                </Space>
              )}
            </div>
          </div>
        </div>
      </Card>
      <Modal title="Cambiar precio de toda la familia" open={globalOpen} closable={!globalApplying} maskClosable={!globalApplying} onCancel={() => { if (!globalApplying) setGlobalOpen(false); }} footer={globalProgress?.completed === globalProgress?.total ? <Button onClick={() => setGlobalOpen(false)}>Listo</Button> : <><Button disabled={globalApplying} onClick={() => setGlobalOpen(false)}>Cancelar</Button><Button disabled={globalApplying || globalPrice === null || globalPrice <= 0} type="primary" onClick={() => void saveGlobalPrice()}>Aplicar precio</Button></>}>
        <Typography.Paragraph>Se actualizarán {family.children.length} publicaciones.</Typography.Paragraph>
        <Typography.Paragraph strong>Vas a cambiar el precio de {family.children.length} publicaciones a ${globalPrice ?? "—"}.</Typography.Paragraph>
        <Input type="number" min={0.01} value={globalPrice ?? ""} onChange={(event) => setGlobalPrice(event.target.value ? Number(event.target.value) : null)} placeholder="Nuevo precio" />
        {globalProgress ? <><Typography.Paragraph>Actualizando precios: {globalProgress.completed} de {globalProgress.total}</Typography.Paragraph><Progress percent={Math.round(globalProgress.completed / globalProgress.total * 100)} /><Typography.Text type="danger">{globalProgress.failures.length ? `MLA con error: ${globalProgress.failures.join(", ")}` : ""}</Typography.Text></> : null}
      </Modal>
      <Typography.Title level={4}>Publicaciones de la familia</Typography.Title>
      {variantGroups.map((group) => (
        <section key={group.key}>
          <Divider titlePlacement="start">{group.label}</Divider>
          <div className={styles.familyChildren}>
            {group.publications.map((child) => (
              <PublicationWorkspaceEditor
                key={child.itemId}
                publication={child}
                onChanged={onChanged}
                onSave={onSave}
                onStatusChange={onStatusChange}
                onTitleSave={onTitleSave}
                getTiendanubeProductByMlAction={getTiendanubeProductByMlAction}
              />
            ))}
          </div>
        </section>
      ))}
    </section>
  );

  async function applyGlobalPrice(nextPrice: number) {
    if (globalApplying) return;
    const total = family.children.length;
    setGlobalApplying(true); setGlobalProgress({ completed: 0, total, failures: [] });
    const failures: string[] = [];
    for (const [index, child] of family.children.entries()) {
      try {
        const result = await onSave({ publicationId: child.itemId, target: { type: "family", familyId: family.familyId, itemId: child.itemId }, current: { sku: child.sku, stock: child.stock, price: child.standardPrice ?? child.price }, draft: { sku: child.sku, stock: child.stock, price: nextPrice } });
        if (!result.ok || result.confirmed.price !== nextPrice) failures.push(child.itemId);
      } catch { failures.push(child.itemId); }
      setGlobalProgress({ completed: index + 1, total, failures: [...failures] });
    }
    await onChanged();
    setGlobalApplying(false);
    if (failures.length) {
      setGlobalPrice(currentGlobalPrice);
      draftGlobalPriceRef.current = currentGlobalPrice;
      messageApi.error(`${total - failures.length} actualizadas, ${failures.length} con error`);
      return;
    }
    setEditingGlobalPrice(false);
    messageApi.success(`${total} publicaciones actualizadas correctamente.`);
  }
}

function formatGlobalPrice(value: number, currency: string | null | undefined): string {
  try {
    return new Intl.NumberFormat("es-AR", { style: "currency", currency: currency ?? "ARS", maximumFractionDigits: 0 }).format(value);
  } catch {
    return `$ ${value.toLocaleString("es-AR")}`;
  }
}

function listingTypeLabel(value: string | null): string {
  if (!value) return "Sin modalidad";
  if (value === "gold_pro") return "Premium";
  if (value === "gold_special") return "Clásica";
  return value;
}

function selectionPublications(
  selection: PublicationWorkspaceSelection,
): readonly PublicationWorkspaceItem[] {
  return selection.type === "family"
    ? [...selection.children]
    : [selection.publication];
}
