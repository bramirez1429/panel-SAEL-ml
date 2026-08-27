import type { PublicationPromotionResult } from "../domain/publication-promotion.model";

type PromotionCompletionCallbacks = Readonly<{
  showSuccess: (message: string) => void;
  showPartial: (result: PublicationPromotionResult) => void;
  close: () => void;
  refresh: () => void;
}>;

export function handlePromotionCompletion(
  result: PublicationPromotionResult,
  successMessage: string,
  callbacks: PromotionCompletionCallbacks,
): "SUCCESS" | "PARTIAL_FAILURE" {
  if (!result.success || result.status === "PARTIAL_FAILURE") {
    callbacks.showPartial(result);
    return "PARTIAL_FAILURE";
  }
  callbacks.showSuccess(successMessage);
  callbacks.close();
  callbacks.refresh();
  return "SUCCESS";
}
