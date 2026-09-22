"use client";

import { Alert, Modal } from "antd";
import { useEffect, useMemo, useState } from "react";

import type {
  BulkStockJob,
  BulkStockPreview,
  BulkStockPreviewRequest,
  BulkStockProductType,
  BulkStockJobItem,
  BulkStockJobTarget,
  BulkStockVariant,
  CreateBulkStockJobAction,
  CreateBulkStockJobRequest,
  GetBulkStockJobAction,
  PreviewBulkStockAction,
} from "../domain/bulk-stock.model";
import { isBulkStockJobRunning } from "../domain/bulk-stock.model";
import { BulkStockForm } from "./bulk-stock-form.client";
import { BulkStockPreviewView, isSelectable } from "./bulk-stock-preview.client";
import { BulkStockProgress } from "./bulk-stock-progress.client";
import { BulkStockFinalSummary } from "./bulk-stock-summary.client";

const ACTIVE_JOB_STORAGE_KEY = "publications.bulk-stock.active-job";
const POLLING_INTERVAL_MS = 1_500;

type Phase = "configuration" | "preview" | "execution";

type BulkStockModalProps = Readonly<{
  open: boolean;
  previewAction: PreviewBulkStockAction;
  createJobAction: CreateBulkStockJobAction;
  getJobAction: GetBulkStockJobAction;
  onClose: () => void;
}>;

export function BulkStockModal({
  open,
  previewAction,
  createJobAction,
  getJobAction,
  onClose,
}: BulkStockModalProps) {
  const [phase, setPhase] = useState<Phase>("configuration");
  const [preview, setPreview] = useState<BulkStockPreview | null>(null);
  const [previewProductType, setPreviewProductType] = useState<BulkStockProductType | null>(null);
  const [selectedKeys, setSelectedKeys] = useState<ReadonlySet<string>>(new Set());
  const [jobId, setJobId] = useState<string | null>(null);
  const [job, setJob] = useState<BulkStockJob | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pollingError, setPollingError] = useState<string | null>(null);

  const running = phase === "execution" && (!job || isBulkStockJobRunning(job.status));
  const selectedVariants = useMemo(() => (
    preview?.variants.filter((variant) => selectedKeys.has(variant.key) && isSelectable(variant)) ?? []
  ), [preview, selectedKeys]);

  const resumeStoredJob = () => {
    if (phase !== "configuration" || jobId) return;
    const storedJobId = window.localStorage.getItem(ACTIVE_JOB_STORAGE_KEY)?.trim();
    if (!storedJobId) return;
    setJobId(storedJobId);
    setJob(null);
    setPhase("execution");
  };

  useEffect(() => {
    if (!open || phase !== "execution" || !jobId) return;
    let active = true;
    let timeout: number | undefined;

    const poll = async () => {
      const result = await getJobAction(jobId);
      if (!active) return;
      if (!result.ok) {
        setPollingError(result.message);
        timeout = window.setTimeout(() => void poll(), POLLING_INTERVAL_MS);
        return;
      }

      setPollingError(null);
      setJob(result.data);
      if (isBulkStockJobRunning(result.data.status)) {
        timeout = window.setTimeout(() => void poll(), POLLING_INTERVAL_MS);
      } else {
        window.localStorage.removeItem(ACTIVE_JOB_STORAGE_KEY);
      }
    };

    void poll();
    return () => {
      active = false;
      if (timeout !== undefined) window.clearTimeout(timeout);
    };
  }, [getJobAction, jobId, open, phase]);

  const findVariants = async (request: BulkStockPreviewRequest) => {
    setLoading(true);
    setError(null);
    const result = await previewAction(request);
    setLoading(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setPreview(result.data);
    setPreviewProductType(request.productType);
    setSelectedKeys(new Set(result.data.variants.filter(isSelectable).map((variant) => variant.key)));
    setPhase("preview");
  };

  const createJob = async (request: CreateBulkStockJobRequest) => {
    setLoading(true);
    setError(null);
    const result = await createJobAction(request);
    setLoading(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    window.localStorage.setItem(ACTIVE_JOB_STORAGE_KEY, result.data.jobId);
    setJobId(result.data.jobId);
    setJob(null);
    setPollingError(null);
    setPhase("execution");
  };

  const applyChanges = () => {
    if (!preview || selectedVariants.length === 0) return;
    void createJob({
      targets: selectedVariants.map(toJobTarget),
    });
  };

  const retryErrors = () => {
    if (!job) return;
    const failed = job.items
      .filter((item) => item.status === "ERROR")
      .map(jobItemToJobTarget)
      .filter((target): target is BulkStockJobTarget => target !== null);
    if (failed.length === 0) return;
    void createJob({
      targets: failed,
    });
  };

  const reset = () => {
    window.localStorage.removeItem(ACTIVE_JOB_STORAGE_KEY);
    setPhase("configuration");
    setPreview(null);
    setPreviewProductType(null);
    setSelectedKeys(new Set());
    setJobId(null);
    setJob(null);
    setError(null);
    setPollingError(null);
    setLoading(false);
  };

  const finish = () => {
    reset();
    onClose();
  };

  const requestClose = () => {
    if (!running) onClose();
  };

  return (
    <Modal
      afterOpenChange={(visible) => {
        if (visible) resumeStoredJob();
      }}
      centered
      closable={!running}
      footer={null}
      keyboard={!running}
      mask={{ closable: !running }}
      open={open}
      styles={{ body: { display: "flex", flexDirection: "column", height: "calc(100vh - 132px)", minHeight: 0, overflow: "hidden", paddingInline: 4 } }}
      title={modalTitle(phase)}
      width="100vw"
      onCancel={requestClose}
    >
      {phase === "configuration" ? (
        <div style={{ flex: "1 1 auto", minHeight: 0, overflowY: "auto" }}>
          <BulkStockForm error={error} loading={loading} onSubmit={(request) => void findVariants(request)} />
        </div>
      ) : null}
      {phase === "preview" && preview ? (
        <div style={{ display: "flex", flex: "1 1 auto", flexDirection: "column", minHeight: 0 }}>
          {error ? <Alert message={error} showIcon style={{ marginBottom: 16 }} type="error" /> : null}
          <BulkStockPreviewView
            preview={preview}
            productType={previewProductType ?? undefined}
            selectedKeys={selectedKeys}
            submitting={loading}
            onBack={() => {
              setError(null);
              setPhase("configuration");
            }}
            onSelectionChange={setSelectedKeys}
            onSubmit={applyChanges}
          />
        </div>
      ) : null}
      {phase === "execution" ? (
        <div style={{ flex: "1 1 auto", minHeight: 0, overflowY: "auto" }}>
          <BulkStockProgress job={job} pollingError={pollingError} />
          {job && !isBulkStockJobRunning(job.status) ? (
            <BulkStockFinalSummary
              job={job}
              retrying={loading}
              onFinish={finish}
              onRetryErrors={retryErrors}
            />
          ) : null}
        </div>
      ) : null}
    </Modal>
  );
}

function toJobTarget(variant: BulkStockVariant): BulkStockJobTarget {
  return {
    identifier: variant.key,
    title: variant.title,
    color: variant.color,
    size: variant.size,
    itemId: variant.itemId,
    userProductId: variant.userProductId,
    variationId: variant.variationId,
    familyId: variant.familyId,
    model: variant.model,
    currentQuantity: variant.currentQuantity,
    requestedQuantity: variant.requestedQuantity,
    currentStatus: variant.currentStatus,
    needsChange: variant.needsChange,
    editable: variant.editable,
    ...(variant.reason ? { reason: variant.reason } : {}),
    ...(variant.storeId ? { storeId: variant.storeId } : {}),
    ...(variant.networkNodeId ? { networkNodeId: variant.networkNodeId } : {}),
  };
}

function jobItemToJobTarget(item: BulkStockJobItem): BulkStockJobTarget | null {
  if (
    !item.identifier ||
    !item.itemId ||
    !item.model ||
    item.previousStock === null ||
    item.newStock === null ||
    item.editable !== true
  ) return null;
  return {
    identifier: item.identifier,
    title: item.title,
    color: item.color,
    size: item.size,
    itemId: item.itemId,
    userProductId: item.userProductId,
    variationId: item.variationId,
    familyId: item.familyId ?? null,
    model: item.model,
    currentQuantity: item.previousStock,
    requestedQuantity: item.newStock,
    currentStatus: item.previousStatus ?? null,
    needsChange: item.previousStock !== item.newStock,
    editable: item.editable,
    ...(item.reason ? { reason: item.reason } : {}),
    ...(item.storeId ? { storeId: item.storeId } : {}),
    ...(item.networkNodeId ? { networkNodeId: item.networkNodeId } : {}),
  };
}

function modalTitle(phase: Phase): string {
  if (phase === "preview") return "Stock masivo · Vista previa";
  if (phase === "execution") return "Stock masivo · Ejecución";
  return "Stock masivo · Configuración";
}
