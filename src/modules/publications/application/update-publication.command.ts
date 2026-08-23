import type {
  PublicationEditRepository,
  PublicationEditTarget,
  PublicationEditStatus,
} from "../domain/publication-edit.repository";
import {
  changedPublicationFields,
  publicationEditDraftSchema,
  type PublicationEditDraft,
} from "./publication-edit.validation";
import type { PublicationEditSnapshot } from "./publication-edit.validation";
import { AppError } from "@/shared/errors/app-error";

export type UpdatePublicationInput = Readonly<{
  publicationId: string;
  target: PublicationEditTarget;
  current: PublicationEditSnapshot;
  draft: PublicationEditDraft;
}>;

/** Orquesta validación y cambios; no conoce HTTP ni cookies. */
export class UpdatePublicationCommand {
  constructor(private readonly repository: PublicationEditRepository) {}

  async execute(input: UpdatePublicationInput): Promise<boolean> {
    const current = input.current;
    const draft = publicationEditDraftSchema.parse(input.draft);
    const changes = changedPublicationFields(current, draft);

    if (changes.price !== undefined && changes.price !== null) {
      await runOperation("precio", () => this.repository.updatePrice(input.target, changes.price!));
    }
    if (changes.stock !== undefined && changes.stock !== null) {
      await runOperation("stock", () => this.repository.updateStock(input.target, changes.stock!));
    }
    if (changes.sku !== undefined && changes.sku !== null) {
      await runOperation("SKU", () => this.repository.updateSku(input.target, changes.sku!));
    }

    return Object.keys(changes).length > 0;
  }

  async updateStatus(target: PublicationEditTarget, status: PublicationEditStatus): Promise<void> {
    await runOperation("estado", () => this.repository.updateStatus(target, status));
  }
}

async function runOperation(label: string, operation: () => Promise<void>): Promise<void> {
  try {
    await operation();
  } catch (error: unknown) {
    const detail = error instanceof Error ? error.message : "Error desconocido del backend.";
    throw new AppError(`No se pudo actualizar ${label}: ${detail}`, "PUBLICATION_UPDATE_ERROR", { cause: error });
  }
}
