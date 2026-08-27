import type {
  PublicationPromotionPreview,
  PublicationPromotionResult,
} from "./publication-promotion.model";

export type PromotionActionFailure = Readonly<{
  ok: false;
  message: string;
  diagnosticCode?: string;
}>;

export type PromotionPreviewActionResult =
  | Readonly<{ ok: true; preview: PublicationPromotionPreview }>
  | PromotionActionFailure;

export type PromotionExecutionActionResult =
  | Readonly<{ ok: true; result: PublicationPromotionResult }>
  | PromotionActionFailure;
