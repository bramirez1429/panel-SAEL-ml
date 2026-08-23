import type {
  PublicationEditRepository,
  PublicationEditTarget,
} from "../domain/publication-edit.repository";
import {
  changedPublicationFields,
  publicationEditDraftSchema,
  type PublicationEditDraft,
} from "./publication-edit.validation";
import type { PublicationEditSnapshot } from "./publication-edit.validation";

export type UpdatePublicationInput = Readonly<{
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
      await this.repository.updatePrice(input.target, changes.price);
    }
    if (changes.stock !== undefined && changes.stock !== null) {
      await this.repository.updateStock(input.target, changes.stock);
    }
    if (changes.sku !== undefined && changes.sku !== null) {
      await this.repository.updateSku(input.target, changes.sku);
    }

    return Object.keys(changes).length > 0;
  }
}
