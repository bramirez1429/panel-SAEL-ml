import { NextResponse } from "next/server";
import { unstable_rethrow } from "next/navigation";
import { getSalesOperations } from "@/modules/sales/operations/sales-operations.server";

export const dynamic = "force-dynamic";
export async function GET() {
  try {
    return NextResponse.json(await getSalesOperations(), { headers: { "Cache-Control": "no-store, private" } });
  } catch (error) {
    unstable_rethrow(error);
    return NextResponse.json({ message: "No se pudieron cargar las ventas." }, {
      status: 503, headers: { "Cache-Control": "no-store, private" },
    });
  }
}
