"use client";

import { create } from "zustand";

import type { PromotionRow } from "../domain/promotion.model";
import type { PromotionOption } from "../domain/promotions.repository";

export type CachedPromotionOptions =
  | Readonly<{ status: "loading" }>
  | Readonly<{ status: "success"; options: readonly PromotionOption[] }>
  | Readonly<{ status: "error" }>;

export type SelectedPromotion = Readonly<{
  key: string;
  itemId: string;
  familyId: string | null;
  publicationTitle: string;
  option: PromotionOption;
}>;

type PromotionGlobalState = Readonly<{
  optionsByItem: Readonly<Record<string, CachedPromotionOptions>>;
  selections: Readonly<Record<string, SelectedPromotion>>;
  startOptionsLoad: (itemId: string) => void;
  saveOptions: (itemId: string, options: readonly PromotionOption[]) => void;
  failOptions: (itemId: string) => void;
  toggleSelection: (selection: SelectedPromotion) => void;
  removeSelections: (keys: readonly string[]) => void;
  invalidateOptions: (itemIds: readonly string[]) => void;
}>;

const initialState = {
  optionsByItem: {},
  selections: {},
} as const;

export const usePromotionGlobalStore = create<PromotionGlobalState>((set) => ({
  ...initialState,
  startOptionsLoad: (itemId) => set((state) => ({
    optionsByItem: { ...state.optionsByItem, [itemId]: { status: "loading" } },
  })),
  saveOptions: (itemId, options) => set((state) => ({
    optionsByItem: { ...state.optionsByItem, [itemId]: { status: "success", options } },
  })),
  failOptions: (itemId) => set((state) => ({
    optionsByItem: { ...state.optionsByItem, [itemId]: { status: "error" } },
  })),
  toggleSelection: (selection) => set((state) => {
    const selections = { ...state.selections };
    if (selections[selection.key]) delete selections[selection.key];
    else selections[selection.key] = selection;
    return { selections };
  }),
  removeSelections: (keys) => set((state) => {
    const selections = { ...state.selections };
    keys.forEach((key) => delete selections[key]);
    return { selections };
  }),
  invalidateOptions: (itemIds) => set((state) => {
    const optionsByItem = { ...state.optionsByItem };
    itemIds.forEach((itemId) => delete optionsByItem[itemId]);
    return { optionsByItem };
  }),
}));

export function promotionSelection(
  row: PromotionRow,
  option: PromotionOption,
): SelectedPromotion {
  return {
    key: promotionSelectionKey(row.itemId, option),
    itemId: row.itemId,
    familyId: row.familyId,
    publicationTitle: row.title,
    option,
  };
}

export function promotionSelectionKey(
  itemId: string,
  option: Pick<PromotionOption, "type" | "id" | "offerId">,
): string {
  return [itemId, option.type ?? "", option.id ?? "", option.offerId ?? ""].join("::");
}

export function resetPromotionGlobalStore(): void {
  usePromotionGlobalStore.setState(initialState);
}
