"use server";
import { revalidatePath } from "next/cache";
import { createPromotionsRepository } from "../promotions.composition.server";
export async function deactivatePromotion(itemId: string): Promise<{ ok: true } | { ok: false; message: string }> { try { await createPromotionsRepository().remove(itemId); revalidatePath("/promociones"); return { ok: true }; } catch { return { ok: false, message: "No se pudo desactivar la promoción." }; } }
