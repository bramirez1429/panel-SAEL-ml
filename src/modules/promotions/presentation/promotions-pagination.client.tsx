"use client";

import { Pagination, Spin } from "antd";
import { useRouter, useSearchParams } from "next/navigation";
import {
  useEffect,
  useRef,
  useState,
  useTransition,
  type ReactNode,
} from "react";

import type { PromotionsPage } from "../domain/promotion.model";
import {
  promotionCursorContextKey,
  rememberPromotionCursor,
  visitedPromotionCursor,
} from "./promotions-cursor-history.client";
import {
  knownPromotionsPages,
  parsePromotionsPage,
  PROMOTIONS_PAGE_SIZE,
} from "./promotions-pagination.model";
import styles from "./promotions-pagination.module.css";

type Props = Readonly<{
  page: PromotionsPage;
  children: ReactNode;
}>;

export function PromotionsPagination({ page, children }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentPage = parsePromotionsPage(searchParams.get("page"));
  const contextKey = promotionCursorContextKey(searchParams);
  const [requestedPage, setRequestedPage] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();
  const navigatingRef = useRef(false);
  const tableAnchor = useRef<HTMLDivElement>(null);
  const previousPage = useRef(currentPage);
  const loading = isPending || (requestedPage !== null && requestedPage !== currentPage);
  const knownPages = knownPromotionsPages(currentPage, page.done, page.nextCursor);

  useEffect(() => {
    const currentCursor = searchParams.get("cursor");
    if (currentCursor) rememberPromotionCursor(contextKey, currentPage, currentCursor);
  }, [contextKey, currentPage, searchParams]);

  useEffect(() => {
    if (requestedPage === currentPage) {
      navigatingRef.current = false;
    }
    if (previousPage.current !== currentPage) {
      previousPage.current = currentPage;
      tableAnchor.current?.scrollIntoView?.({ behavior: "smooth", block: "start" });
    }
  }, [currentPage, requestedPage]);

  function navigate(targetPage: number): void {
    if (targetPage === currentPage || navigatingRef.current) return;
    const cursor = cursorForTarget(targetPage);
    if (targetPage > 1 && !cursor) return;

    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(targetPage));
    if (cursor) params.set("cursor", cursor);
    else params.delete("cursor");
    if (targetPage === currentPage + 1 && cursor) {
      rememberPromotionCursor(contextKey, targetPage, cursor);
    }

    navigatingRef.current = true;
    setRequestedPage(targetPage);
    startTransition(() => router.push(`/promociones?${params.toString()}`));
  }

  function cursorForTarget(targetPage: number): string | null {
    if (targetPage === 1) return null;
    if (targetPage === currentPage + 1) return page.nextCursor;
    return visitedPromotionCursor(contextKey, targetPage);
  }

  return <>
    <div ref={tableAnchor} className={styles.tableArea}>
      <Spin spinning={loading} tip="Cargando publicaciones...">
        {children}
      </Spin>
    </div>
    <div className={styles.pagination}>
      <Pagination
        current={currentPage}
        disabled={loading}
        pageSize={PROMOTIONS_PAGE_SIZE}
        showQuickJumper={false}
        showSizeChanger={false}
        total={knownPages * PROMOTIONS_PAGE_SIZE}
        onChange={navigate}
      />
    </div>
  </>;
}
