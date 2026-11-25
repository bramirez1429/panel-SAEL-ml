import "server-only";

import { headers } from "next/headers";
import { getApiConfig } from "@/shared/api/api-config";
import { createAuthenticatedHttpClient } from "@/shared/api/authenticated-http-client.server";
import { HttpClient } from "@/shared/api/http-client.server";
import { operationsSchema } from "./sales-operations.model";

const SALES_PREVIEW_ORIGIN =
  "https://panel-ml-git-feat-ventas-operativas-bramirez14s-projects.vercel.app";

export function salesOperationsClient() {
  const config = getApiConfig();
  // Only this feature's preview talks to the matching backend preview.
  // Production and the existing API configuration are untouched.
  if (process.env.VERCEL_ENV !== "preview" ||
      process.env.SALES_PREVIEW_BACKEND_URL !== SALES_PREVIEW_ORIGIN) {
    return createAuthenticatedHttpClient(new HttpClient(config));
  }

  const previewFetch: typeof fetch = async (input, init) => {
    const url = new URL(input instanceof Request ? input.url : String(input));
    if (url.origin !== SALES_PREVIEW_ORIGIN) {
      throw new Error("Origen de ventas preview inválido.");
    }
    const token = (await headers()).get("x-vercel-oidc-token");
    if (!token) throw new Error("Identidad de Vercel no disponible.");
    const outgoing = new Headers(init?.headers);
    outgoing.set("x-vercel-trusted-oidc-idp-token", token);
    return fetch(input, { ...init, headers: outgoing, redirect: "error" });
  };

  return createAuthenticatedHttpClient(
    new HttpClient({ ...config, baseUrl: SALES_PREVIEW_ORIGIN }, previewFetch),
  );
}

export async function getSalesOperations() {
  return operationsSchema.parse(
    await salesOperationsClient().get("/sales/operations", { timeoutMs: 30000 }),
  );
}
