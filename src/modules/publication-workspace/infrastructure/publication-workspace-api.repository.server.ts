import "server-only";

import { ApiError } from "@/shared/api/api-error";
import type { AuthenticatedHttpClient } from "@/shared/api/authenticated-http-client.server";

import { getBestPublicationImage } from "../application/get-best-publication-image";
import type {
  PublicationWorkspaceRepository,
  PublicationWorkspaceSearchRequest,
  PublicationWorkspaceTitleUpdateResult,
} from "../domain/publication-workspace.repository";
import {
  publicationWorkspaceDetailResponseSchema,
  publicationWorkspaceFamilyResponseSchema,
  publicationWorkspaceFamilyTaskResponseSchema,
  publicationWorkspaceFamilyTaskStatusSchema,
  publicationWorkspaceSearchResponseSchema,
} from "./publication-workspace-response.schema";

const SEARCH_ENDPOINT = "/mercadolibre/direct/publicaciones/search";
const FAMILY_TASK_POLL_INTERVAL_MS = 750;
const FAMILY_TASK_MAX_ATTEMPTS = 40;

export class PublicationWorkspaceApiRepository
  implements PublicationWorkspaceRepository
{
  constructor(
    private readonly httpClient: Pick<AuthenticatedHttpClient, "get" | "patch">,
  ) {}

  async search(request: PublicationWorkspaceSearchRequest) {
    const query = new URLSearchParams({
      q: request.query,
      limit: String(request.limit),
    });
    if (request.cursor) query.set("cursor", request.cursor);

    const response = await this.httpClient.get(
      `${SEARCH_ENDPOINT}?${query.toString()}`,
    );
    const validation = publicationWorkspaceSearchResponseSchema.safeParse(response);

    if (!validation.success) {
      throw new ApiError(
        "El backend devolvió resultados de búsqueda con un formato inválido.",
        "API_INVALID_RESPONSE",
        { cause: validation.error },
      );
    }

    return validation.data.items.map((item) => ({
      itemId: item.itemId,
      familyId: item.familyId,
      userProductId: item.userProductId ?? null,
      title: item.title ?? item.itemId,
      imageUrl: item.thumbnail,
      price: item.price,
      currency: item.currencyId,
      status: item.status,
      stock: item.stock,
    }));
  }

  async getById(itemId: string) {
    const response = await this.httpClient.get(
      `/mercadolibre/direct/publicaciones/${encodeURIComponent(itemId)}`,
    );
    const validation = publicationWorkspaceDetailResponseSchema.safeParse(response);

    if (!validation.success) {
      throw new ApiError(
        "El backend devolvió un detalle de publicación con un formato inválido.",
        "API_INVALID_RESPONSE",
        { cause: validation.error },
      );
    }

    const publication = validation.data;
    return {
      imageUrl: getBestPublicationImage(publication),
      thumbnailUrl: publication.thumbnail,
      title: publication.title ?? publication.itemId,
      itemId: publication.itemId,
      familyId: publication.familyId,
      model: publication.model,
      sku: publication.sku,
      status: publication.status ?? "Sin estado",
      stock: publication.stock.available,
      sold: publication.stock.sold,
      price: publication.price.current,
      regularPrice: publication.price.regular,
      currency: publication.price.currency,
      hasActivePromotion: publication.friendly.promotion.hasActivePromotion,
      promotionDiscountPercent: publication.friendly.pricing.discountPercent,
      installmentLabel: publication.installmentLabel ?? null,
    };
  }

  async getFamily(familyId: string) {
    const response = await this.httpClient.get(
      `/mercadolibre/direct/familias/${encodeURIComponent(familyId)}`,
    );
    const validation = publicationWorkspaceFamilyResponseSchema.safeParse(response);

    if (!validation.success) {
      throw new ApiError(
        "El backend devolvió una familia con un formato inválido.",
        "API_INVALID_RESPONSE",
        { cause: validation.error },
      );
    }

    const family = validation.data;
    const children = family.variants.map((item) => ({
        imageUrl: getBestPublicationImage(item),
        thumbnailUrl: item.thumbnail,
        title: item.title ?? item.itemId,
        itemId: item.itemId,
        familyId: family.familyId,
        model: "VARIANT_PRICING" as const,
        sku: item.sku.sellerCustomField,
        status: item.status ?? "Sin estado",
        stock: item.stock.available,
        sold: item.stock.sold,
        price: item.price.current,
        regularPrice: item.price.regular,
        currency: item.price.currency,
        hasActivePromotion: item.friendly.promotion.hasActivePromotion,
        promotionDiscountPercent: item.friendly.pricing.discountPercent,
        installmentLabel: item.installmentLabel ?? null,
        attributes: item.attributes.map((attribute) => ({
          id: attribute.id,
          name: attribute.name ?? null,
          value: attribute.value_name ?? null,
        })),
      }));

    return {
      type: "family" as const,
      familyId: family.familyId,
      familyName: family.familyName,
      imageUrl: children[0]?.thumbnailUrl ?? null,
      children,
    };
  }

  async updateTitle(
    target:
      | Readonly<{ type: "publication"; itemId: string }>
      | Readonly<{ type: "family"; familyId: string }>,
    title: string,
  ): Promise<PublicationWorkspaceTitleUpdateResult> {
    if (target.type === "family") {
      const response = await this.httpClient.patch(
        `/mercadolibre/direct/edicion/nueva/${encodeURIComponent(target.familyId)}`,
        { familyName: title },
      );
      const task = publicationWorkspaceFamilyTaskResponseSchema.safeParse(response);

      if (!task.success) {
        throw new ApiError(
          "El backend no devolvió una tarea válida para actualizar la familia.",
          "API_INVALID_RESPONSE",
          { cause: task.error },
        );
      }

      const taskResult = await this.waitForFamilyTask(task.data.task_id);
      if (taskResult.status === "failed") return taskResult;

      return {
        status: "completed" as const,
        family: await this.getFamily(target.familyId),
      };
    }

    await this.httpClient.patch(
      `/mercadolibre/direct/edicion/clasica/${encodeURIComponent(target.itemId)}`,
      { title },
    );
    return { status: "completed" as const, family: null };
  }

  private async waitForFamilyTask(taskId: string) {
    for (let attempt = 0; attempt < FAMILY_TASK_MAX_ATTEMPTS; attempt += 1) {
      if (attempt > 0) await delay(FAMILY_TASK_POLL_INTERVAL_MS);

      const response = await this.httpClient.get(
        `/mercadolibre/direct/edicion/nueva/tasks/${encodeURIComponent(taskId)}`,
      );
      const task = publicationWorkspaceFamilyTaskStatusSchema.safeParse(response);

      if (!task.success) {
        throw new ApiError(
          "El backend devolvió un estado de tarea de familia inválido.",
          "API_INVALID_RESPONSE",
          { cause: task.error },
        );
      }

      const outcome = familyTaskOutcome(task.data);
      if (outcome === "completed") return { status: "completed" as const };
      if (outcome === "failed") {
        return {
          status: "failed" as const,
          message: familyTaskFailureMessage(task.data),
        };
      }
    }

    return {
      status: "failed" as const,
      message: "Mercado Libre todavía no confirmó el cambio. Intentá nuevamente.",
    };
  }
}

type FamilyTaskStatus = ReturnType<
  typeof publicationWorkspaceFamilyTaskStatusSchema.parse
>;

function familyTaskOutcome(
  task: FamilyTaskStatus,
): "pending" | "completed" | "failed" {
  const status = task.status.toLowerCase();
  const userProductStatuses = (task.user_products ?? []).map(
    (userProduct) => userProduct.status.toLowerCase(),
  );

  if (
    ["failed", "error", "rejected", "cancelled", "canceled"].includes(status)
    || userProductStatuses.some((value) => (
      ["failed", "error", "rejected", "cancelled", "canceled"].includes(value)
    ))
  ) {
    return "failed";
  }

  if (
    ["completed", "finished", "succeeded", "success"].includes(status)
    || (
      userProductStatuses.length > 0
      && userProductStatuses.every((value) => ["completed", "succeeded", "success"].includes(value))
    )
  ) {
    return "completed";
  }

  return "pending";
}

function familyTaskFailureMessage(task: FamilyTaskStatus): string {
  const reasons = (task.user_products ?? []).flatMap((userProduct) => (
    userProduct.reasons ?? []
  ));
  const messages = reasons
    .map((reason) => reason.message?.trim() || reason.code?.trim())
    .filter((message): message is string => Boolean(message));

  return messages.length > 0
    ? [...new Set(messages)].join(" ")
    : "Mercado Libre rechazó el cambio de nombre de la familia.";
}

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}
