"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { operationsSchema, type OrderKey, type SalesOperations } from "./sales-operations.model";
import { completeSaleAction, readSaleAction } from "./sales-operations.actions";

type OperationsContext = {
  data: SalesOperations | null;
  error: string | null;
  loading: boolean;
  refresh: () => Promise<boolean>;
  complete: (order: OrderKey, completed: boolean) => Promise<boolean>;
  read: (order: OrderKey) => Promise<boolean>;
};
const Context = createContext<OperationsContext | null>(null);
const POLL_INTERVAL = 30000;

export function SalesOperationsProvider({ children, enabled }: Readonly<{ children: ReactNode; enabled: boolean }>) {
  const [data, setData] = useState<SalesOperations | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);
  const activeRequest = useRef<AbortController | null>(null);

  const refresh = useCallback(async (): Promise<boolean> => {
    if (!enabled) return false;
    activeRequest.current?.abort();
    const controller = new AbortController();
    activeRequest.current = controller;
    try {
      const response = await fetch("/api/sales/operations", { cache: "no-store", signal: controller.signal });
      if (response.redirected) throw new Error("La sesión requiere volver a iniciar sesión.");
      if (!response.ok) {
        const payload: unknown = await response.json().catch(() => null);
        const diagnostic = typeof payload === "object" && payload !== null && "diagnostic" in payload ? payload.diagnostic : null;
        const code = typeof diagnostic === "object" && diagnostic !== null && "code" in diagnostic && typeof diagnostic.code === "string" ? diagnostic.code : `HTTP ${response.status}`;
        throw new Error(`No se pudieron consultar las ventas (${code}).`);
      }
      const parsed = operationsSchema.safeParse(await response.json());
      if (!parsed.success) throw new Error("La respuesta de ventas no coincide con el formato esperado (INVALID_SALES_RESPONSE).");
      const next = parsed.data;
      if (controller.signal.aborted) return false;
      setData(next);
      setError(null);
      return true;
    } catch (error) {
      if (!controller.signal.aborted) setError(error instanceof Error && (error.message.startsWith("No se pudieron consultar") || error.message.startsWith("La respuesta de ventas") || error.message.startsWith("La sesión")) ? error.message : "No se pudieron actualizar las ventas. Volvé a intentar.");
      return false;
    } finally {
      if (activeRequest.current === controller) {
        activeRequest.current = null;
        setLoading(false);
      }
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    void refresh();
    const poll = () => { if (!document.hidden) void refresh(); };
    const interval = window.setInterval(poll, POLL_INTERVAL);
    document.addEventListener("visibilitychange", poll);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", poll);
      activeRequest.current?.abort();
    };
  }, [enabled, refresh]);

  const complete = useCallback(async (order: OrderKey, completed: boolean) => {
    try {
      const result = await completeSaleAction({ ...order, completed });
      if (!result.ok) return false;
      await refresh();
      return true;
    } catch { return false; }
  }, [refresh]);

  const read = useCallback(async (order: OrderKey) => {
    try {
      const result = await readSaleAction(order);
      if (!result.ok) return false;
      await refresh();
      return true;
    } catch { return false; }
  }, [refresh]);

  return <Context.Provider value={{ data, loading, error, refresh, complete, read }}>{children}</Context.Provider>;
}

export function useSalesOperations() {
  const context = useContext(Context);
  if (!context) throw new Error("SalesOperationsProvider is required");
  return context;
}
