import { unstable_rethrow } from "next/navigation";
import { NextResponse } from "next/server";

import { createSyncRepository } from "@/modules/sync/sync.composition.server";
import { AppError } from "@/shared/errors/app-error";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: Readonly<{ params: Promise<{ syncId: string }> }>,
): Promise<Response> {
  const { syncId } = await context.params;

  if (!syncId.trim()) {
    return NextResponse.json(
      { message: "El identificador de sincronización es obligatorio." },
      { status: 400 },
    );
  }

  try {
    const status = await createSyncRepository().getStatus(syncId);
    return NextResponse.json(status, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error: unknown) {
    unstable_rethrow(error);
    return NextResponse.json(
      {
        message: error instanceof AppError
          ? error.message
          : "No se pudo consultar el estado de la sincronización.",
      },
      { status: 500 },
    );
  }
}
