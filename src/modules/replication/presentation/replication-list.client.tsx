"use client";

import { useEffect, useRef, useState } from "react";
import { CloudUploadOutlined } from "@ant-design/icons";
import { Button, Card, Col, Divider, Empty, Row, Spin, Tag, Typography } from "antd";
import { useRouter } from "next/navigation";
import type { TiendanubeCategory } from "@/modules/tiendanube/domain/tiendanube-replication.model";
import { ReplicatePublicationAction, ReplicationModalLoadState, TiendanubeReplicationModal } from "@/modules/tiendanube/presentation/tiendanube-replication-modal.client";
import type { ReplicablePublication, ReplicationPreview } from "../domain/replication.model";
import { CopyableText } from "@/shared/ui/copyable-text.client";
import styles from "./replication-list.module.css";

type PreviewAction = (sourceKey: string) => Promise<Readonly<{ ok: true; preview: ReplicationPreview } | { ok: false; message: string }>>;
type CategoriesAction = () => Promise<Readonly<{ ok: true; categories: readonly TiendanubeCategory[] } | { ok: false; message: string }>>;
type Props = Readonly<{ publications: readonly ReplicablePublication[]; replicateAction: ReplicatePublicationAction; loadPreviewAction: PreviewAction; loadCategoriesAction: CategoriesAction }>;
const { Meta } = Card;

export function ReplicationListClient({ publications, replicateAction, loadPreviewAction, loadCategoriesAction }: Props) {
  const router = useRouter();
  const [visibleCount, setVisibleCount] = useState(20);
  const [appending, setAppending] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const [selected, setSelected] = useState<ReplicablePublication | null>(null);
  const [preview, setPreview] = useState<ReplicationPreview | null>(null);
  const [categories, setCategories] = useState<readonly TiendanubeCategory[]>([]);
  const [loadState, setLoadState] = useState<ReplicationModalLoadState>("LOADING");
  const [loadError, setLoadError] = useState<string | null>(null);

  const visible = publications.slice(0, visibleCount);
  const hasMore = visibleCount < publications.length;

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !hasMore) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry?.isIntersecting || appending) return;
      setAppending(true);
      window.setTimeout(() => { setVisibleCount((count) => Math.min(count + 20, publications.length)); setAppending(false); }, 120);
    }, { rootMargin: "240px" });
    observer.observe(node);
    return () => observer.disconnect();
  }, [appending, hasMore, publications.length]);

  async function openReplication(publication: ReplicablePublication) {
    setSelected(publication); setPreview(null); setCategories([]); setLoadError(null); setLoadState("LOADING");
    try {
      const [previewResult, categoriesResult] = await Promise.all([
        loadPreviewAction(publication.sourceKey).catch(() => ({ ok: false as const, message: "No se pudo cargar el preview de la publicación." })),
        loadCategoriesAction().catch(() => ({ ok: false as const, message: "No se pudieron cargar las categorías de Tiendanube." })),
      ]);
      if (!previewResult.ok) { setLoadError(previewResult.message); setLoadState("LOAD_ERROR"); return; }
      if (!categoriesResult.ok) { setLoadError(categoriesResult.message); setLoadState("LOAD_ERROR"); return; }
      setPreview(previewResult.preview); setCategories(categoriesResult.categories); setLoadState("READY");
    } catch {
      setLoadError("No se pudo cargar la información de replicación.");
      setLoadState("LOAD_ERROR");
    }
  }

  const close = () => setSelected(null);

  return <>
    {publications.length === 0 ? <Empty description="No hay publicaciones para replicar." /> : <>
      <Row className={styles.list} gutter={[16, 16]}>{visible.map((publication) => <Col className={styles.col} key={publication.sourceKey} xs={24} sm={24} md={12} lg={8} xl={6}><ReplicationRow publication={publication} onReplicate={() => void openReplication(publication)} /></Col>)}</Row>
      <div ref={sentinelRef} className={styles.sentinel}>{appending ? <Spin size="small" /> : null}</div>
    </>}
    {selected ? <TiendanubeReplicationModal open sourceKey={selected.sourceKey} action={replicateAction} categories={categories} preview={preview} loadState={loadState} loadError={loadError} onLoadRetry={() => void openReplication(selected)} onGoToIntegrations={() => router.push("/integraciones")} onClose={close} /> : null}
  </>;
}

function ReplicationRow({ publication, onReplicate }: Readonly<{ publication: ReplicablePublication; onReplicate: () => void }>) {
  const cover = <img className={styles.image} src={publication.thumbnailUrl ?? ""} alt={publication.title} />;
  const identifiers = <><Identifier label="Family ID" value={publication.familyId} /><Identifier label="MLA" value={publication.itemId} /><Identifier label="MLAU" value={publication.userProductId} /></>;

  return <Card className={styles.card} hoverable cover={cover}>
    <Meta
      title={<Typography.Text strong className={styles.title}>{publication.title}</Typography.Text>}
      description={<Tag bordered={false} className={styles.sold}>{publication.sold} vendidos</Tag>}
    />
    {formatPublicationPrice(publication.priceFrom, publication.priceTo, publication.currency) ? <Typography.Text strong className={styles.price}>{formatPublicationPrice(publication.priceFrom, publication.priceTo, publication.currency)}</Typography.Text> : null}
    <Divider className={styles.divider} />
    <div className={styles.identifiers}>{identifiers}</div>
    <Button className={styles.cta} type="primary" size="small" block icon={<CloudUploadOutlined />} onClick={onReplicate}>Replicar TN</Button>
  </Card>;
}

function formatPublicationPrice(priceFrom: number | null, priceTo: number | null, currency: string | null): string | null {
  const from = priceFrom ?? priceTo;
  const to = priceTo ?? priceFrom;
  if (from === null || to === null) return null;

  const format = (value: number) => new Intl.NumberFormat("es-AR").format(value);
  const prefix = currency?.trim() || "$";
  return from === to ? `${prefix} ${format(from)}` : `${prefix} ${format(from)} - ${format(to)}`;
}

function Identifier({ label, value }: Readonly<{ label: string; value: string | null }>) {
  return <div className={styles.identifier}>{value ? <><small>{label}</small><CopyableText value={value} label={value} copyLabel={label} /></> : null}</div>;
}

