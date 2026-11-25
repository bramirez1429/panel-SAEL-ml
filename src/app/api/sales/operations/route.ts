import { NextResponse } from "next/server";
import { unstable_rethrow } from "next/navigation";
import { ApiError } from "@/shared/api/api-error";
import { ZodError } from "zod";
import { getSalesOperations } from "@/modules/sales/operations/sales-operations.server";

export const dynamic = "force-dynamic";
export async function GET() {
  try {
    return NextResponse.json(await getSalesOperations(), { headers: { "Cache-Control": "no-store, private" } });
  } catch (error) {
    unstable_rethrow(error);
    const diagnostic = error instanceof ApiError
      ? { code: error.code, status: error.status ?? null }
      : error instanceof ZodError
        ? { code: "INVALID_SALES_RESPONSE", paths: error.issues.slice(0, 8).map((issue) => issue.path.join(".")) }
        : { code: "UNEXPECTED_SALES_ERROR" };
    console.error("[sales/operations]", JSON.stringify(diagnostic));
    return NextResponse.json({ message: "No se pudieron cargar las ventas.", diagnostic }, {
      status: 503, headers: { "Cache-Control": "no-store, private" },
    });
  }
}
