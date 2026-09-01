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

type NavigationRequest = Readonly<{
  targetPage: number;
  href: string;
}>;

export function PromotionsPagination({ page, children }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentPage = parsePromotionsPage(searchParams.get("page"));
  const currentCursor = searchParams.get("cursor");
  const currentQuery = searchParams.toString();
  const contextKey = promotionCursorContextKey(searchParams);
  const [navigationRequest, setNavigationRequest] = useState<NavigationRequest | null>(null);
  const [isPending, startTransition] = useTransition();
  const startedNavigationRef = useRef<string | null>(null);
  const tableAnchor = useRef<HTMLDivElement>(null);
  const loading = isPending || navigationRequest !== null;
  const knownPages = knownPromotionsPages(currentPage, page.done, page.nextCursor);

  useEffect(() => {
    if (currentCursor) rememberPromotionCursor(contextKey, currentPage, currentCursor);
  }, [contextKey, currentCursor, currentPage]);

  useEffect(() => {
    if (!navigationRequest) return;
    if (startedNavigationRef.current === navigationRequest.href) return;
    startedNavigationRef.current = navigationRequest.href;
    startTransition(() => router.push(navigationRequest.href));
  }, [navigationRequest, router, startTransition]);

  useEffect(() => {
    if (!navigationRequest || navigationRequest.targetPage !== currentPage) return;
    if (startedNavigationRef.current !== navigationRequest.href) return;
    startedNavigationRef.current = null;
    setNavigationRequest(null);
    tableAnchor.current?.scrollIntoView?.({ behavior: "smooth", block: "start" });
  }, [currentPage, navigationRequest]);

  function requestNavigation(targetPage: number): void {
    if (targetPage === currentPage || navigationRequest) return;
    const cursor = cursorForTarget(targetPage);
    if (targetPage > 1 && !cursor) return;

    const params = new URLSearchParams(currentQuery);
    params.set("page", String(targetPage));
    if (cursor) params.set("cursor", cursor);
    else params.delete("cursor");
    const nextQuery = params.toString();
    if (nextQuery === currentQuery) return;
    if (targetPage === currentPage + 1 && cursor) {
      rememberPromotionCursor(contextKey, targetPage, cursor);
    }

    setNavigationRequest({
      targetPage,
      href: `/promociones?${nextQuery}`,
    });
  }

  function cursorForTarget(targetPage: number): string | null {
    if (targetPage === 1) return null;
    if (targetPage === currentPage + 1) return page.nextCursor;
    return visitedPromotionCursor(contextKey, targetPage);
  }

  return <>
    <div ref={tableAnchor} className={styles.tableArea}>
      <Spin spinning={loading} description="Cargando publicaciones...">
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
        onChange={requestNavigation}
      />
    </div>
  </>;
}
