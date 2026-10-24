"use client";

import { Button, Modal } from "antd";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

import { applySelectionWithRetry } from "./apply-selection-with-retry.client";
import {
  pendingExecutions,
  PromotionExecutionProgress,
  PromotionFinalSummary,
  type PromotionExecution,
} from "./promotion-bulk-execution";
import { PromotionBulkPriceEditor } from "./promotion-bulk-price-editor.client";
import {
  applyCampaignPrice,
  canEditPromotionPrice,
  initialCampaignPriceExclusions,
  initialPromotionPrices,
  hasPendingPromotionOperation,
  promotionCampaignKey,
  validSelectionPrice,
  type CampaignPriceExclusions,
  type CampaignPrices,
  type CampaignPriceWarnings,
} from "./promotion-bulk-price.helpers";
import type { SelectedPromotion } from "./promotion-global.store";
import { usePromotionGlobalStore } from "./promotion-global.store";

type Props = Readonly<{
  selections: readonly SelectedPromotion[];
  onClose: () => void;
  onCompleted?: () => void | Promise<void>;
}>;

export function PromotionBulkApplicationModal({ selections, onClose, onCompleted }: Props) {
  const router = useRouter();
  const activeRef = useRef(false);
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const [campaignPrices, setCampaignPrices] = useState<CampaignPrices>({});
  const [campaignPriceApplied, setCampaignPriceApplied] = useState<Readonly<Record<string, boolean>>>({});
  const [prices, setPrices] = useState(() => initialPromotionPrices(selections));
  const [excludedFromCampaign, setExcludedFromCampaign] = useState<CampaignPriceExclusions>(
    () => initialCampaignPriceExclusions(selections),
  );
  const [campaignWarnings, setCampaignWarnings] = useState<CampaignPriceWarnings>({});
  const [executions, setExecutions] = useState<readonly PromotionExecution[]>(
    () => pendingExecutions(selections),
  );
  const removeSelections = usePromotionGlobalStore((state) => state.removeSelections);
  const invalidateOptions = usePromotionGlobalStore((state) => state.invalidateOptions);
  const pendingSelections = selections.filter((selection) =>
    hasPendingPromotionOperation(selection, prices[selection.key] ?? null));
  const hasUnappliedCampaignPrice = Object.entries(campaignPrices).some(
    ([campaignKey, price]) => (
      price !== null && campaignPriceApplied[campaignKey] !== true
    ),
  );
  const canConfirm = pendingSelections.length > 0 && !hasUnappliedCampaignPrice;
  const processed = executions.filter((execution) => (
    execution.status === "success" || execution.status === "error"
  )).length;
  const successes = executions.filter((execution) => execution.status === "success");
  const failures = executions.filter((execution) => execution.status === "error");

  function applyPriceToCampaign(campaignKey: string): void {
    const campaignSelections = selections.filter(
      (selection) => promotionCampaignKey(selection) === campaignKey,
    );
    const result = applyCampaignPrice(
      campaignSelections,
      prices,
      excludedFromCampaign,
      campaignPrices[campaignKey] ?? null,
    );
    setPrices(result.prices);
    setCampaignWarnings((current) => ({
      ...withoutKeys(current, campaignSelections.map((selection) => selection.key)),
      ...result.warnings,
    }));
    setCampaignPriceApplied((current) => ({ ...current, [campaignKey]: true }));
  }

  function changeCampaignPrice(campaignKey: string, price: number | null): void {
    const campaignSelectionKeys = selections
      .filter((selection) => promotionCampaignKey(selection) === campaignKey)
      .map((selection) => selection.key);
    setCampaignPrices((current) => ({ ...current, [campaignKey]: price }));
    setCampaignPriceApplied((current) => ({ ...current, [campaignKey]: false }));
    setCampaignWarnings((current) => withoutKeys(current, campaignSelectionKeys));
  }

  function changePrice(key: string, price: number | null): void {
    const selection = selections.find((item) => item.key === key);
    setPrices((current) => ({ ...current, [key]: price }));
    setCampaignWarnings((current) => withoutKey(current, key));
    if (selection) {
      const campaignKey = promotionCampaignKey(selection);
      setCampaignPriceApplied((current) => ({ ...current, [campaignKey]: false }));
    }
  }

  function changeCampaignExclusion(key: string, excluded: boolean): void {
    const selection = selections.find((item) => item.key === key);
    if (!selection) return;
    const campaignKey = promotionCampaignKey(selection);

    setExcludedFromCampaign((current) => ({ ...current, [key]: excluded }));
    setCampaignWarnings((current) => withoutKey(current, key));
    setCampaignPriceApplied((current) => ({ ...current, [campaignKey]: false }));
  }

  async function start(): Promise<void> {
    if (activeRef.current || !canConfirm) return;

    activeRef.current = true;
    setRunning(true);

    const completed: PromotionExecution[] = pendingExecutions(pendingSelections);

    try {
      for (let index = 0; index < pendingSelections.length; index += 1) {
        const selection = pendingSelections[index];
        if (!selection) continue;

        completed[index] = {
          selection,
          status: "processing",
          message: null,
        };

        setExecutions([...completed]);

        try {
          const editablePrice = canEditPromotionPrice(selection.option);
          const selectedPrice = editablePrice ? prices[selection.key] ?? null : null;
          const result = await applySelectionWithRetry({
            itemId: selection.itemId,
            option: !editablePrice || selectedPrice === null
              ? selection.option
              : { ...selection.option, promotionPrice: selectedPrice },
            selectedPrice,
          });

          completed[index] = result.ok
            ? { selection, status: "success", message: result.confirmedPrice == null ? null : `Precio confirmado: ${result.confirmedPrice.toLocaleString("es-AR")}` }
            : { selection, status: "error", message: result.message };
        } catch {
          completed[index] = {
            selection,
            status: "error",
            message: "No pudimos completar esta promoción. Continuamos con la siguiente.",
          };
        }

        setExecutions([...completed]);
      }

      const successfulKeys = completed
        .filter((execution) => execution.status === "success")
        .map((execution) => execution.selection.key);
      const successfulItemIds = completed
        .filter((execution) => execution.status === "success")
        .map((execution) => execution.selection.itemId);

      removeSelections(successfulKeys);
      invalidateOptions([...new Set(successfulItemIds)]);
      try {
        if (successfulItemIds.length > 0) await onCompleted?.();
      } catch {}
      try {
        router.refresh();
      } catch {}
      setFinished(true);
    } finally {
      setRunning(false);
      activeRef.current = false;
    }
  }

  return (
    <Modal
      title={finished ? "Proceso completado" : "Promociones seleccionadas"}
      open
      width={900}
      styles={{ body: { maxHeight: "70vh", overflowY: "auto" } }}
      onCancel={running ? undefined : onClose}
      closable={!running}
      mask={{ closable: !running }}
      keyboard={!running}
      footer={finished
        ? <Button type="primary" onClick={onClose}>Listo</Button>
        : running
          ? null
          : (
            canConfirm
              ? <Button type="primary" onClick={() => void start()}>Confirmar {pendingSelections.length} promociones</Button>
              : <span>No hay cambios pendientes para guardar</span>
          )}
    >
      {finished ? (
        <PromotionFinalSummary successes={successes} failures={failures} />
      ) : running ? (
        <PromotionExecutionProgress
          executions={executions}
          processed={processed}
          total={pendingSelections.length}
        />
      ) : (
        <PromotionBulkPriceEditor
          selections={selections}
          prices={prices}
          campaignPrices={campaignPrices}
          excludedFromCampaign={excludedFromCampaign}
          campaignWarnings={campaignWarnings}
          campaignPriceApplied={campaignPriceApplied}
          onCampaignPriceChange={changeCampaignPrice}
          onApplyCampaignPrice={applyPriceToCampaign}
          onPriceChange={changePrice}
          onExcludedFromCampaignChange={changeCampaignExclusion}
        />
      )}
    </Modal>
  );
}

function withoutKeys<T>(record: Readonly<Record<string, T>>, keys: readonly string[]) {
  return keys.reduce((current, key) => withoutKey(current, key), record);
}

function withoutKey<T>(record: Readonly<Record<string, T>>, key: string) {
  if (!(key in record)) return record;
  const next = { ...record };
  delete next[key];
  return next;
}
