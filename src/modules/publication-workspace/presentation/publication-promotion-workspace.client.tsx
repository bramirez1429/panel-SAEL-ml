"use client";

import { PictureOutlined } from "@ant-design/icons";
import { Button, Card, Divider, Image, Input, List, Tabs, Typography } from "antd";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { parsePublicationSearch } from "@/shared/lib/publication-search";
import { groupPublicationsByVariant } from "@/shared/lib/publication-variant";
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
  PublicationWorkspaceSearchItem,
  PublicationWorkspaceSearchResult,
  PublicationWorkspaceSelection,
  PublicationWorkspaceSelectionRequest,
  PublicationWorkspaceSelectionResult,
} from "../domain/publication-workspace.model";
import {
  EditableWorkspaceTitle,
  PublicationWorkspaceEditor,
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
  replicateTiendanubeAction?: ReplicatePublicationAction;
  tiendanubeCategories?: readonly TiendanubeCategory[];
}>;

type ViewState = "initial" | "searching" | "results" | "empty" | "error" | "selected";

export function PublicationPromotionWorkspace({
  getTiendanubeStateAction,
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
          getTiendanubeStateAction={getTiendanubeStateAction}
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
  getTiendanubeStateAction,
  onChanged,
  onSave,
  onStatusChange,
  onTitleSave,
  replicateTiendanubeAction,
  tiendanubeCategories,
}: Readonly<{
  selection: PublicationWorkspaceSelection;
  getTiendanubeStateAction?: GetTiendanubeReplicationStateAction;
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
              getTiendanubeStateAction={getTiendanubeStateAction}
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
            ? <PublicationWorkspacePromotions selection={selection} onChanged={onChanged} />
            : null,
        },
      ]}
    />
  );
}

function PublicationTab({
  selection,
  getTiendanubeStateAction,
  onChanged,
  onSave,
  onStatusChange,
  onTitleSave,
  replicateTiendanubeAction,
  tiendanubeCategories,
}: Readonly<{
  selection: PublicationWorkspaceSelection;
  getTiendanubeStateAction?: GetTiendanubeReplicationStateAction;
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
        <FamilyWorkspace family={selection} onChanged={onChanged} onSave={onSave} onStatusChange={onStatusChange} onTitleSave={onTitleSave} />
      ) : (
        <PublicationWorkspaceEditor
          publication={selection.publication}
          onChanged={onChanged}
          onSave={onSave}
          onStatusChange={onStatusChange}
          onTitleSave={onTitleSave}
          showFamilyId
          titleTarget={selection.publication.model === "SHARED" ? { type: "publication", itemId: selection.publication.itemId } : undefined}
        />
      )}
    </>
  );
}

function tiendanubeSourceKey(selection: PublicationWorkspaceSelection): string {
  if (selection.type === "family") return `family:${selection.familyId}`;
  return selection.publication.familyId
    ? `family:${selection.publication.familyId}`
    : `item:${selection.publication.itemId}`;
}

function FamilyWorkspace({ family, onChanged, onSave, onStatusChange, onTitleSave }: Readonly<{
  family: Extract<PublicationWorkspaceSelection, { type: "family" }>;
  onChanged: () => Promise<void>;
  onSave: WorkspaceSaveAction;
  onStatusChange: WorkspaceStatusAction;
  onTitleSave: WorkspaceTitleAction;
}>) {
  const totalSold = family.children.reduce((total, child) => total + child.sold, 0);
  const variantGroups = groupPublicationsByVariant(family.children);

  return (
    <section className={styles.familyWorkspace}>
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
          </div>
        </div>
      </Card>
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
              />
            ))}
          </div>
        </section>
      ))}
    </section>
  );
}
