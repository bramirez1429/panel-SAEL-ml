"use client";

import { Alert, Card, Typography } from "antd";
import { useCallback, useEffect, useRef, useState } from "react";

import type {
  TiendanubeActiveMigrationActionResult,
  TiendanubeMigrationActionResult,
  TiendanubeMigrationOutcome,
  TiendanubeMigrationProgress,
  TiendanubeMigrationResultsActionResult,
  TiendanubeMigrationResultsPage,
} from "../domain/tiendanube-migration.model";
import { MigrationCircularProgress } from "./migration-circular-progress";
import { MigrationCounters } from "./migration-counters";
import { MigrationCurrentProduct } from "./migration-current-product";
import { MigrationResultList } from "./migration-result-list";
import { MigrationStartButton } from "./migration-start-button.client";
import styles from "./tiendanube-migration-view.module.css";

const POLLING_INTERVAL_MS = 4000;
const RESULTS_PAGE_SIZE = 20;

type Props = Readonly<{
  startAction(): Promise<TiendanubeMigrationActionResult>;
  getActiveAction(): Promise<TiendanubeActiveMigrationActionResult>;
  getStatusAction(jobId: string): Promise<TiendanubeMigrationActionResult>;
  getResultsAction(jobId: string, outcome: TiendanubeMigrationOutcome, page: number, pageSize: number): Promise<TiendanubeMigrationResultsActionResult>;
}>;

function isActionError(value: TiendanubeMigrationActionResult | TiendanubeActiveMigrationActionResult | TiendanubeMigrationResultsActionResult): value is Readonly<{ ok: false; message: string }> {
  return value !== null && "ok" in value && value.ok === false;
}

function isActive(progress: TiendanubeMigrationProgress | null): boolean {
  return progress?.status === "PENDING" || progress?.status === "DISCOVERING" || progress?.status === "RUNNING";
}

export function TiendanubeMigrationView({ startAction, getActiveAction, getStatusAction, getResultsAction }: Props) {
  const [progress, setProgress] = useState<TiendanubeMigrationProgress | null>(null);
  const [approvedPage, setApprovedPage] = useState<TiendanubeMigrationResultsPage | null>(null);
  const [rejectedPage, setRejectedPage] = useState<TiendanubeMigrationResultsPage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const startingRef = useRef(false);
  const statusInFlightRef = useRef(false);
  const resultsInFlightRef = useRef(false);
  const resultsQueuedRef = useRef(false);
  const approvedPageRef = useRef(1);
  const rejectedPageRef = useRef(1);

  const refreshResults = useCallback(async (jobId: string): Promise<void> => {
    if (resultsInFlightRef.current) {
      resultsQueuedRef.current = true;
      return;
    }
    resultsInFlightRef.current = true;
    try {
      const [approved, rejected] = await Promise.all([
        getResultsAction(jobId, "APPROVED", approvedPageRef.current, RESULTS_PAGE_SIZE),
        getResultsAction(jobId, "REJECTED", rejectedPageRef.current, RESULTS_PAGE_SIZE),
      ]);
      if (isActionError(approved)) {
        setError(approved.message);
      } else {
        setApprovedPage(approved);
      }
      if (isActionError(rejected)) {
        setError(rejected.message);
      } else {
        setRejectedPage(rejected);
      }
    } finally {
      resultsInFlightRef.current = false;
      if (resultsQueuedRef.current) {
        resultsQueuedRef.current = false;
        void refreshResults(jobId);
      }
    }
  }, [getResultsAction]);

  const applyProgress = useCallback((nextProgress: TiendanubeMigrationProgress): void => {
    setProgress(nextProgress);
    void refreshResults(nextProgress.jobId);
  }, [refreshResults]);

  const refreshStatus = useCallback(async (jobId: string): Promise<void> => {
    if (statusInFlightRef.current) return;
    statusInFlightRef.current = true;
    try {
      const result = await getStatusAction(jobId);
      if (isActionError(result)) {
        setError(result.message);
        return;
      }
      setError(null);
      applyProgress(result);
    } finally {
      statusInFlightRef.current = false;
    }
  }, [applyProgress, getStatusAction]);

  const recoverActive = useCallback(async (): Promise<void> => {
    const result = await getActiveAction();
    if (result === null) return;
    if (isActionError(result)) {
      setError(result.message);
      return;
    }
    applyProgress(result);
  }, [applyProgress, getActiveAction]);

  useEffect(() => {
    void recoverActive();
  }, [recoverActive]);

  useEffect(() => {
    if (!progress || !isActive(progress)) return;
    const interval = window.setInterval(() => void refreshStatus(progress.jobId), POLLING_INTERVAL_MS);
    return () => window.clearInterval(interval);
  }, [progress, refreshStatus]);

  async function start(): Promise<void> {
    if (startingRef.current || isActive(progress)) return;
    startingRef.current = true;
    setStarting(true);
    setError(null);
    approvedPageRef.current = 1;
    rejectedPageRef.current = 1;
    try {
      const result = await startAction();
      if (isActionError(result)) {
        setError(result.message);
        void recoverActive();
        return;
      }
      applyProgress(result);
    } finally {
      startingRef.current = false;
      setStarting(false);
    }
  }

  function changeResultPage(outcome: TiendanubeMigrationOutcome, nextPage: number): void {
    if (!progress) return;
    if (outcome === "APPROVED") approvedPageRef.current = nextPage;
    else rejectedPageRef.current = nextPage;
    void refreshResults(progress.jobId);
  }

  return <main className={styles.page}>
    <section className={styles.intro} aria-live="polite">
      <Typography.Title level={2}>Migración global</Typography.Title>
      <Typography.Paragraph type="secondary">Iniciá la migración de todos los productos de Mercado Libre hacia Tiendanube.</Typography.Paragraph>
      <MigrationStartButton disabled={starting || isActive(progress)} loading={starting} onStart={() => void start()} />
      {error ? <Alert className={styles.alert} message={error} showIcon type="error" /> : null}
      {progress?.status === "FAILED" ? <Alert className={styles.alert} message="La migración no pudo completarse." showIcon type="error" /> : null}
      {progress?.status === "CANCELLED" ? <Alert className={styles.alert} message="La migración fue cancelada." showIcon type="warning" /> : null}
    </section>

    {progress ? <section className={styles.progressSection} aria-live="polite">
      <Card className={styles.progressCard}>
        <MigrationCircularProgress progress={progress} />
        <MigrationCounters progress={progress} />
        <MigrationCurrentProduct product={progress.currentProduct} />
      </Card>
    </section> : null}

    {progress ? <section className={styles.results}>
      <MigrationResultList outcome="REJECTED" page={rejectedPage} onPageChange={(page) => changeResultPage("REJECTED", page)} />
      <MigrationResultList outcome="APPROVED" page={approvedPage} onPageChange={(page) => changeResultPage("APPROVED", page)} />
    </section> : null}
  </main>;
}
