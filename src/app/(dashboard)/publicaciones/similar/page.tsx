import { Alert, Button } from "antd";
import { notFound } from "next/navigation";
import { isSimilarPublicationSourceKey } from "@/modules/publications/domain/similar-publication.model";
import { createGetSimilarPublicationDraftQuery } from "@/modules/publications/publications.composition.server";
import { SimilarPublicationForm } from "@/modules/publications/presentation/similar-publication-form.client";
import { replicatePublicationAction } from "../tiendanube.action";
import { getTiendanubeCategories } from "@/modules/tiendanube/tiendanube.composition.server";
import { AppError } from "@/shared/errors/app-error";
import {
  createSimilarPublicationAction,
  uploadSimilarPublicationPictureAction,
} from "./similar-publication.action";
import type { SimilarPublicationDraft } from "@/modules/publications/domain/similar-publication.model";
import type { TiendanubeCategory } from "@/modules/tiendanube/domain/tiendanube-replication.model";

export const dynamic = "force-dynamic";

type Props = Readonly<{
  searchParams: Promise<Readonly<Record<string, string | string[] | undefined>>>;
}>;

export default async function SimilarPublicationPage({ searchParams }: Props) {
  const params = await searchParams;
  const sourceKey = first(params.sourceKey);
  if (!sourceKey || !isSimilarPublicationSourceKey(sourceKey)) notFound();
  const returnTo = safeReturnTo(first(params.returnTo));

  const result = await loadSimilarPublication(sourceKey);
  if (result.state === "error") {
    return (
      <div style={{ marginTop: 24 }}>
        <Alert message={result.message} showIcon type="error" />
        <Button href={returnTo} style={{ marginTop: 16 }}>Volver a publicaciones</Button>
      </div>
    );
  }
  return (
    <SimilarPublicationForm
      categories={result.categories}
      createAction={createSimilarPublicationAction}
      draft={result.draft}
      replicateAction={replicatePublicationAction}
      returnTo={returnTo}
      uploadAction={uploadSimilarPublicationPictureAction}
    />
  );
}

type LoadResult =
  | Readonly<{ state: "success"; draft: SimilarPublicationDraft; categories: readonly TiendanubeCategory[] }>
  | Readonly<{ state: "error"; message: string }>;

async function loadSimilarPublication(sourceKey: string): Promise<LoadResult> {
  try {
    const [draft, categories] = await Promise.all([
      createGetSimilarPublicationDraftQuery().execute(sourceKey),
      getTiendanubeCategories().catch(() => [] as readonly TiendanubeCategory[]),
    ]);
    return { state: "success", draft, categories };
  } catch (error: unknown) {
    return {
      state: "error",
      message: error instanceof AppError
        ? error.message
        : "No se pudo cargar el borrador seguro de la publicación.",
    };
  }
}

function first(value: string | string[] | undefined): string | undefined {
  return typeof value === "string" ? value : value?.[0];
}

function safeReturnTo(value: string | undefined): string {
  return value?.startsWith("/publicaciones") && !value.startsWith("//")
    ? value
    : "/publicaciones";
}
