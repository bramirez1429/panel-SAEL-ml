import { NextResponse } from "next/server";

import {
  createAuthenticatedHttpClient,
} from "@/shared/api/authenticated-http-client.server";

import {
  HttpClient,
} from "@/shared/api/http-client.server";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
) {
  const url = new URL(request.url);

  const itemId =
    url.searchParams
      .get("itemId")
      ?.trim();

  if (!itemId) {
    return NextResponse.json(
      {
        error: "itemId es obligatorio",
      },
      { status: 400 },
    );
  }

  try {
    const http =
      createAuthenticatedHttpClient(
        new HttpClient(),
      );

    const data = await http.get(
      `/mercadolibre/direct/promociones/diagnostico/${encodeURIComponent(
        itemId,
      )}`,
      {
        timeoutMs: 60_000,
      },
    );

    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error(
      "promotion diagnostic error",
      error,
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Error desconocido",
      },
      { status: 500 },
    );
  }
}
