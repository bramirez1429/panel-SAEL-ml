import "server-only";
import { getApiConfig } from "@/shared/api/api-config";
import { createAuthenticatedHttpClient } from "@/shared/api/authenticated-http-client.server";
import { HttpClient } from "@/shared/api/http-client.server";
import { operationsSchema } from "./sales-operations.model";

export const salesOperationsClient = () =>
  createAuthenticatedHttpClient(new HttpClient(getApiConfig()));

export async function getSalesOperations() {
  return operationsSchema.parse(await salesOperationsClient().get("/sales/operations", { timeoutMs: 30000 }));
}
