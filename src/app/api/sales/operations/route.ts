import { NextResponse } from "next/server";
import { unstable_rethrow } from "next/navigation";
import { getSalesOperations } from "@/modules/sales/operations/sales-operations.server";

export const dynamic = "force-dynamic";

function diagnose(error: unknown): { code: string; status?: number } {
  if (typeof error !== "object" || error === null) return { code: "UNEXPECTED_SALES_ERROR" };
  if ("name" in error && error.name === "ZodError") return { code: "INVALID_SALES_RESPONSE" };
  if ("code" in error && typeof error.code === "string" && /^API_[A-Z_]+$/.test(error.code)) {
    return { code: error.code, ...("status" in error && typeof error.status === "number" ? { status: error.status } : {}) };
  }
  return { code: "UNEXPECTED_SALES_ERROR" };
}

export async function GET() {
  try {
    return NextResponse.json(await getSalesOperations(), { headers: { "Cache-Control": "no-store, private" } });
  } catch (error) {
    unstable_rethrow(error);
    const diagnostic = diagnose(error);
    console.error("[sales/operations]", JSON.stringify(diagnostic));
    return NextResponse.json({ message: "No se pudieron cargar las ventas.", diagnostic }, {
      status: 503, headers: { "Cache-Control": "no-store, private" },
    });
  }
}
