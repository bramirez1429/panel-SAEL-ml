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
  initialPromotionPrices,
  priceForCampaignExclusion,
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
}>;

export function PromotionBulkApplicationModal({ selections, onClose }: Props) {
  const router = useRouter();
  const activeRef = useRef(false);
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const [campaignPrices, setCampaignPrices] = useState<CampaignPrices>({});
  const [campaignPriceApplied, setCampaignPriceApplied] = useState<Readonly<Record<string, boolean>>>({});
  const [prices, setPrices] = useState(() => initialPromotionPrices(selections));
  const [excludedFromCampaign, setExcludedFromCampaign] = useState<CampaignPriceExclusions>({});
  const [campaignWarnings, setCampaignWarnings] = useState<CampaignPriceWarnings>({});
  const [executions, setExecutions] = useState<readonly PromotionExecution[]>(
    () => pendingExecutions(selections),
  );
  const removeSelections = usePromotionGlobalStore((state) => state.removeSelections);
  const invalidateOptions = usePromotionGlobalStore((state) => state.invalidateOptions);
  const valid = selections.every((selection) => (
    validSelectionPrice(selection, prices[selection.key] ?? null)
  ));
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
    setCampaignPrices((current) => ({ ...current, [campaignKey]: price }));
    setCampaignPriceApplied((current) => ({ ...current, [campaignKey]: false }));
  }

  function changePrice(key: string, price: number | null): void {
    setPrices((current) => ({ ...current, [key]: price }));
    setCampaignWarnings((current) => withoutKey(current, key));
  }

  function changeCampaignExclusion(key: string, checked: boolean): void {
    const selection = selections.find((item) => item.key === key);
    if (!selection) return;
    const campaignKey = promotionCampaignKey(selection);

    const result = priceForCampaignExclusion(
      selection,
      checked,
      campaignPrices[campaignKey] ?? null,
      prices[key] ?? null,
    );

    setExcludedFromCampaign((current) => ({ ...current, [key]: checked }));
    setPrices((current) => ({ ...current, [key]: result.price }));
    setCampaignWarnings((current) => (
      result.invalidCampaignPrice === null
        ? withoutKey(current, key)
        : { ...current, [key]: result.invalidCampaignPrice }
    ));
  }

  async function start(): Promise<void> {
    if (activeRef.current || !valid) return;

    activeRef.current = true;
    setRunning(true);

    const completed: PromotionExecution[] = pendingExecutions(selections);

    try {
      for (let index = 0; index < selections.length; index += 1) {
        const selection = selections[index];
        if (!selection) continue;

        completed[index] = {
          selection,
          status: "processing",
          message: null,
        };

        setExecutions([...completed]);

        try {
          const result = await applySelectionWithRetry({
            itemId: selection.itemId,
            option: selection.option,
            selectedPrice: selection.option.requiresPriceSelection === true
              ? prices[selection.key] ?? null
              : null,
          });

          completed[index] = result.ok
            ? { selection, status: "success", message: null }
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

      removeSelections(successfulKeys);
      invalidateOptions([...new Set(selections.map((selection) => selection.itemId))]);
      setFinished(true);
      router.refresh();
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
            <Button type="primary" disabled={!valid} onClick={() => void start()}>
              Confirmar {selections.length} promociones
            </Button>
          )}
    >
      {finished ? (
        <PromotionFinalSummary successes={successes} failures={failures} />
      ) : running ? (
        <PromotionExecutionProgress
          executions={executions}
          processed={processed}
          total={selections.length}
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
