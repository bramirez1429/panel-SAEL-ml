"use client";

import { PictureOutlined } from "@ant-design/icons";
import { Button, Card, Image, Input, List, Tabs, Typography } from "antd";
import { useState } from "react";

import { parsePublicationSearch } from "@/shared/lib/publication-search";

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
import styles from "./publication-promotion-workspace.module.css";

type Props = Readonly<{
  onSearch(term: string): Promise<PublicationWorkspaceSearchResult>;
  onSelect(request: PublicationWorkspaceSelectionRequest): Promise<PublicationWorkspaceSelectionResult>;
  onSave: WorkspaceSaveAction;
  onStatusChange: WorkspaceStatusAction;
  onTitleSave: WorkspaceTitleAction;
}>;

type ViewState = "initial" | "searching" | "results" | "empty" | "error" | "selected";

export function PublicationPromotionWorkspace({ onSearch, onSelect, onSave, onStatusChange, onTitleSave }: Props) {
  const [query, setQuery] = useState("");
  const [selection, setSelection] = useState<PublicationWorkspaceSelection | null>(null);
  const [matches, setMatches] = useState<readonly PublicationWorkspaceSearchItem[]>([]);
  const [viewState, setViewState] = useState<ViewState>("initial");
  const criteria = parsePublicationSearch(query);

  async function handleSearch(rawTerm: string) {
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
      if (firstItem) await loadSelection({ itemId: firstItem.itemId });
    } catch {
      setViewState("error");
    }
  }

  async function loadSelection(request: PublicationWorkspaceSelectionRequest) {
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
          onChange={(event) => setQuery(event.target.value)}
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
      {viewState === "results" && <PublicationMatches items={matches} onSelect={(item) => loadSelection(item.familyId ? { familyId: item.familyId } : { itemId: item.itemId })} />}
      {viewState === "selected" && selection && (
        <WorkspaceTabs selection={selection} onSave={onSave} onStatusChange={onStatusChange} onTitleSave={onTitleSave} />
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

function WorkspaceTabs({ selection, onSave, onStatusChange, onTitleSave }: Readonly<{
  selection: PublicationWorkspaceSelection;
  onSave: WorkspaceSaveAction;
  onStatusChange: WorkspaceStatusAction;
  onTitleSave: WorkspaceTitleAction;
}>) {
  return (
    <Tabs
      items={[
        {
          key: "publication",
          label: "Publicación",
          children: selection.type === "family"
            ? <FamilyWorkspace family={selection} onSave={onSave} onStatusChange={onStatusChange} onTitleSave={onTitleSave} />
            : <PublicationWorkspaceEditor publication={selection.publication} onSave={onSave} onStatusChange={onStatusChange} onTitleSave={onTitleSave} titleTarget={selection.publication.model === "SHARED" ? { type: "publication", itemId: selection.publication.itemId } : undefined} />,
        },
        {
          key: "promotion",
          label: "Promoción",
          children: <Card><Typography.Text type="secondary">Las promociones todavía no están disponibles en este workspace.</Typography.Text></Card>,
        },
      ]}
    />
  );
}

function FamilyWorkspace({ family, onSave, onStatusChange, onTitleSave }: Readonly<{
  family: Extract<PublicationWorkspaceSelection, { type: "family" }>;
  onSave: WorkspaceSaveAction;
  onStatusChange: WorkspaceStatusAction;
  onTitleSave: WorkspaceTitleAction;
}>) {
  return (
    <section className={styles.familyWorkspace}>
      <Card>
        <div className={styles.familyHeader}>
          {family.imageUrl
            ? <Image alt={family.familyName ?? family.familyId} className={styles.familyImage} preview={false} src={family.imageUrl} />
            : <span className={styles.familyImagePlaceholder}><PictureOutlined /></span>}
          <div>
            <Typography.Text type="secondary">Family ID</Typography.Text>
            <div className={styles.familyTitle}>
              <EditableWorkspaceTitle initialTitle={family.familyName ?? `Familia ${family.familyId}`} onSave={onTitleSave} target={{ type: "family", familyId: family.familyId }} />
            </div>
            <Typography.Text>{family.familyId}</Typography.Text>
          </div>
        </div>
      </Card>
      <Typography.Title level={4}>Publicaciones de la familia</Typography.Title>
      <div className={styles.familyChildren}>
        {family.children.map((child) => (
          <PublicationWorkspaceEditor
            key={child.itemId}
            publication={child}
            onSave={onSave}
            onStatusChange={onStatusChange}
            onTitleSave={onTitleSave}
          />
        ))}
      </div>
    </section>
  );
}
