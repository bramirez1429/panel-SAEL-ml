"use client";

import { Pagination } from "antd";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useTransition } from "react";

import type { PublicationsPage } from "../domain/publication.model";
import { buildPublicationsUrl, parsePublicationsSearchParams } from "./publications-search-params";
import { publicationsCursorContextKey, rememberPublicationsCursor, visitedPublicationsCursor } from "./publications-cursor-history.client";
import styles from "./publications-view.module.css";

export function PublicationsPagination({ page }: Readonly<{ page: PublicationsPage }>) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const contextKey = publicationsCursorContextKey(searchParams);
  const hasNext = !page.done && page.nextCursor !== null;
  const knownPages = page.page + (hasNext ? 1 : 0);

  useEffect(() => {
    if (page.cursor) rememberPublicationsCursor(contextKey, page.page, page.cursor);
  }, [contextKey, page.cursor, page.page]);

  function navigate(targetPage: number): void {
    if (pending || targetPage === page.page) return;
    const cursor = targetPage === page.page + 1 ? page.nextCursor : visitedPublicationsCursor(contextKey, targetPage);
    if (targetPage > 1 && !cursor) return;
    if (cursor) rememberPublicationsCursor(contextKey, targetPage, cursor);
    const current = parsePublicationsSearchParams(Object.fromEntries(searchParams.entries()));
    startTransition(() => router.push(buildPublicationsUrl(current, { page: targetPage, cursor })));
  }

  return <div className={styles.pagination} aria-label="Paginación por cursor"><Pagination current={page.page} disabled={pending} pageSize={page.pageSize} showSizeChanger={false} showQuickJumper={false} total={knownPages * page.pageSize} onChange={navigate} /></div>;
}
