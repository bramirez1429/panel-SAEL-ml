import "server-only";
import { getApiConfig } from "@/shared/api/api-config";
import { createAuthenticatedHttpClient } from "@/shared/api/authenticated-http-client.server";
import { HttpClient } from "@/shared/api/http-client.server";
import { PromotionsApiRepository } from "./infrastructure/promotions-api.repository.server";
export function createPromotionsRepository() { return new PromotionsApiRepository(createAuthenticatedHttpClient(new HttpClient(getApiConfig()))); }
