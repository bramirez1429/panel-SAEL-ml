"use server";
import { createPromotionsRepository } from "../promotions.composition.server";
export async function getPromotionOptions(itemId: string) { return createPromotionsRepository().getOptions(itemId); }
