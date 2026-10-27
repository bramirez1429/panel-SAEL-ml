"use client";

import {
  Alert, Button, Card, Input, InputNumber, Modal,
  Space, Spin, Statistic, Typography,
} from "antd";
import { useEffect, useMemo, useRef, useState } from "react";

import type { TiendanubeProduct } from "@/modules/tiendanube/domain/tiendanube-products.model";
import type {
  ApplyStockBatchResult,
  LoadSizeCatalogResult,
} from "@/app/(dashboard)/tiendanube/talles-masivos/actions";
import {
  colorSizeKey,
  planStockUpdates,
  visibleColorSizes,
  type StockInputs,
  type StockUpdate,
} from "../domain/stock-by-size";

type Props = Readonly<{
  loadPageAction(search: string, page: number): Promise<LoadSizeCatalogResult>;
  applyStockBatchAction(updates: readonly StockUpdate[]): Promise<ApplyStockBatchResult>;
  checkSizeStockReadyAction(): Promise<boolean>;
}>;

const MAX_SCAN_PAGES = 200;
const BATCH_SIZE = 20;

export function TiendanubeSizeRenameView({
  loadPageAction,
  applyStockBatchAction,
  checkSizeStockReadyAction,
}: Props) {
  const [serviceReady, setServiceReady] = useState<boolean | null>(null);
  const [query, setQuery] = useState("buzo de mujer");
  const [searchedQuery, setSearchedQuery] = useState("");
  const [products, setProducts] = useState<readonly TiendanubeProduct[]>([]);
  const [stockInputs, setStockInputs] = useState<StockInputs>({});
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [scannedPages, setScannedPages] = useState(0);
  const [scannedProducts, setScannedProducts] = useState(0);
  const [processed, setProcessed] = useState(0);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [needsReload, setNeedsReload] = useState(false);
  const requestVersion = useRef(0);

  useEffect(() => {
    let active = true;
    void checkSizeStockReadyAction().then((ready) => {
      if (active) setServiceReady(ready);
    }, () => { if (active) setServiceReady(false); });
    return () => { active = false; };
  }, [checkSizeStockReadyAction]);

  async function recheckService(): Promise<void> {
    setServiceReady(null);
    const ready = await checkSizeStockReadyAction().catch(() => false);
    setServiceReady(ready);
  }

  const colorGroups = useMemo(() => visibleColorSizes(products), [products]);
  const planned = useMemo(
    () => planStockUpdates(products, stockInputs),
    [products, stockInputs],
  );
  const visibleVariants = useMemo(
    () => colorGroups.reduce(
      (total, group) => total + group.sizes.reduce((count, size) => count + size.variants, 0), 0,
    ),
    [colorGroups],
  );
  const combinations = colorGroups.reduce((count, group) => count + group.sizes.length, 0);

  async function searchAll(value: string): Promise<void> {
    const term = value.trim();
    if (term.length < 2 || term.length > 80) {
      setError("Ingresá una búsqueda de 2 a 80 caracteres.");
      return;
    }
    const version = ++requestVersion.current;
    setLoading(true);
    setError(null);
    setSuccess(null);
    setNeedsReload(false);
    setProducts([]);
    setStockInputs({});
    setScannedPages(0);
    setScannedProducts(0);
    setSearchedQuery("");
    setProcessed(0);
    setConfirmOpen(false);
    try {
      const found = new Map<string, TiendanubeProduct>();
      let complete = false;
      for (let page = 1; page <= MAX_SCAN_PAGES; page++) {
        const response = await loadPageAction(term, page);
        if (version !== requestVersion.current) return;
        if (!response.ok) throw new Error(response.message);
        if (response.data.page !== page) {
          throw new Error("Tiendanube devolvió una página distinta de la solicitada.");
        }

        for (const product of response.data.products) {
          if (product.status === "visible") found.set(product.id, product);
        }
        setScannedPages(page);
        setScannedProducts(found.size);

        if (!response.data.hasMore) {
          complete = true;
          break;
        }
        if (response.data.products.length === 0) {
          throw new Error("Tiendanube devolvió una página vacía indicando más páginas. La búsqueda no está completa.");
        }
      }
      if (!complete) {
        throw new Error("La búsqueda supera las 200 páginas. No se puede actualizar stock con un catálogo incompleto.");
      }
      if (version !== requestVersion.current) return;
      setProducts([...found.values()]);
      setSearchedQuery(term);
    } catch (caught: unknown) {
      if (version !== requestVersion.current) return;
      setProducts([]);
      setError(caught instanceof Error ? caught.message : "No se pudieron cargar todos los productos.");
    } finally {
      if (version === requestVersion.current) setLoading(false);
    }
  }

  function changeStock(colorSize: string, next: number | null): void {
    setStockInputs((current) => ({ ...current, [colorSize]: next }));
    setError(null);
  }

  async function applyAll(): Promise<void> {
    if (loading || applying || needsReload || serviceReady !== true || planned.length === 0) return;
    const snapshot = [...planned];
    setConfirmOpen(false);
    setApplying(true);
    setError(null);
    setSuccess(null);
    setProcessed(0);
    let updated = 0;
    try {
      for (let index = 0; index < snapshot.length; index += BATCH_SIZE) {
        const chunk = snapshot.slice(index, index + BATCH_SIZE);
        const result = await applyStockBatchAction(chunk);
        if (!result.ok) throw new Error(result.message);
        updated += result.updatedVariantIds.length;
        setProcessed(updated);
        if (result.failedVariantIds.length > 0 ||
            result.updatedVariantIds.length !== chunk.length) {
          throw new Error("Tiendanube no confirmó todas las variantes del último lote.");
        }
      }

      // Re-query Tiendanube to show the real latest values, not optimistic stock.
      await searchAll(searchedQuery);
      setSuccess("Stock global actualizado y verificado: " + updated + " variantes.");
    } catch (caught: unknown) {
      setNeedsReload(true);
      setError(
        "Se confirmaron " + updated + " de " + snapshot.length +
        " variantes. " + (caught instanceof Error ? caught.message : "No se pudo completar la actualización.") +
        " Volvé a buscar antes de reintentar: no se envían automáticamente los lotes pendientes.",
      );
    } finally {
      setApplying(false);
    }
  }

  const changeSummary = useMemo(() => colorGroups.flatMap((group) =>
    group.sizes.flatMap((item) => {
      const next = stockInputs[item.key];
      if (next === undefined || next === null) return [];
      const affected = planned.filter((line) => colorSizeKey(line.color, line.size) === item.key).length;
      return affected === 0 ? [] : [{
        key: item.key,
        color: group.color,
        size: item.size,
        stock: next,
        variants: affected,
      }];
    }),
  ), [planned, colorGroups, stockInputs]);

  return (
    <main style={{ display: "grid", gap: 18, width: "100%" }}>
      <header>
        <Typography.Title level={2}>Tiendanube — Stock masivo por talle</Typography.Title>
        <Typography.Text type="secondary">
          Cada color tiene sus talles y stock por separado. Un cambio en Crema no afecta Negro ni Beige.
        </Typography.Text>
      </header>

      <Card title="Buscar todos los productos visibles">
        <Space orientation="vertical" size="middle" style={{ width: "100%" }}>
          <Input.Search
            aria-label="Buscar productos de Tiendanube"
            enterButton="Buscar todos"
            size="large"
            placeholder="Ejemplo: buzo de mujer, remera..."
            value={query}
            disabled={loading || applying}
            loading={loading}
            onChange={(event) => setQuery(event.target.value)}
            onSearch={(next) => void searchAll(next)}
          />
          <Typography.Text type="secondary">
            Recorre todas las páginas; excluye productos ocultos y no listados. No hace falta seleccionar productos.
          </Typography.Text>
          {loading ? (
            <Space aria-live="polite">
              <Spin size="small" />
              <Typography.Text>
                Buscando página {scannedPages + 1}… {scannedProducts} productos visibles detectados.
              </Typography.Text>
            </Space>
          ) : null}
        </Space>
      </Card>

      {serviceReady === false ? <Alert type="warning" showIcon
        message="El backend de stock masivo todavía no está publicado en este entorno."
        description="Podés consultar talles y preparar stock, pero la confirmación queda bloqueada hasta que el backend compatible esté disponible."
        action={<Button size="small" onClick={() => void recheckService()}>Volver a comprobar</Button>}
      /> : null}
      {error ? <Alert type="error" showIcon message={error} /> : null}
      {success ? <Alert type="success" showIcon message={success} /> : null}

      {searchedQuery && !loading ? (
        <>
          <Card title={'Colores y talles de "' + searchedQuery + '"'}>
            <Space size="large" wrap>
              <Statistic title="Productos visibles" value={products.length} />
              <Statistic title="Variantes visibles con talle" value={visibleVariants} />
              <Statistic title="Colores visibles" value={colorGroups.length} />
              <Statistic title="Combinaciones de color y talle" value={combinations} />
            </Space>
            {colorGroups.length === 0 ? (
              <Alert style={{ marginTop: 16 }} type="info" showIcon
                message="No hay variantes visibles con talle para esta búsqueda." />
            ) : null}
          </Card>

          {colorGroups.length > 0 ? (
            <Card title="Actualizar stock por color y talle">
              <Typography.Paragraph type="secondary">
                Cada color es independiente. El stock nuevo empieza vacío y solo cambia
                las variantes visibles de ese color y talle. Dejarlo vacío no modifica
                nada; escribir 0 sí establece stock cero.
              </Typography.Paragraph>

              <div style={{ display: "grid", gap: 16 }}>
                {colorGroups.map((group) => (
                  <section
                    key={group.key}
                    aria-label={"Color " + group.color}
                    style={{ border: "1px solid #e5eaf1", borderRadius: 8, padding: 14 }}
                  >
                    <Typography.Title level={4} style={{ marginTop: 0 }}>
                      {group.color}
                    </Typography.Title>
                    <div style={{
                      display: "grid",
                      gridTemplateColumns: "minmax(80px, 1fr) minmax(130px, 210px)",
                      gap: 12,
                      padding: "8px 0",
                      borderBottom: "1px solid #e5eaf1",
                    }}>
                      <Typography.Text type="secondary">Talle</Typography.Text>
                      <Typography.Text type="secondary">Stock nuevo</Typography.Text>
                    </div>
                    {group.sizes.map((item) => (
                      <div
                        key={item.key}
                        style={{
                          display: "grid",
                          gridTemplateColumns: "minmax(80px, 1fr) minmax(130px, 210px)",
                          gap: 12,
                          alignItems: "center",
                          padding: "10px 0",
                          borderBottom: "1px solid #f0f1f3",
                        }}
                      >
                        <Typography.Text strong>{item.size}</Typography.Text>
                        <InputNumber
                          aria-label={"Stock nuevo para " + group.color + " talle " + item.size}
                          style={{ width: "100%" }}
                          placeholder="Sin cambio"
                          controls={false}
                          min={0}
                          max={1_000_000}
                          precision={0}
                          disabled={applying || needsReload}
                          value={stockInputs[item.key] ?? null}
                          onChange={(value) => changeStock(item.key, value)}
                        />
                      </div>
                    ))}
                  </section>
                ))}
              </div>

              <Space orientation="vertical" style={{ width: "100%", marginTop: 18 }} size="small">
                <Typography.Text>
                  {planned.length} variantes cambiarían de stock.
                </Typography.Text>
                <Button type="primary" size="large"
                  disabled={planned.length === 0 || applying || needsReload || serviceReady !== true}
                  loading={applying}
                  onClick={() => setConfirmOpen(true)}>
                  Cambiar stock masivamente
                </Button>
                {needsReload ? (
                  <Alert type="warning" showIcon message="Recargá los productos antes de iniciar otra actualización." />
                ) : null}
                {applying ? (
                  <Space>
                    <Spin size="small" />
                    <Typography.Text>Confirmadas {processed} de {planned.length} variantes…</Typography.Text>
                  </Space>
                ) : null}
              </Space>
            </Card>
          ) : null}
        </>
      ) : null}

      <Modal
        title="Confirmar actualización masiva de stock"
        open={confirmOpen}
        okText="Confirmar y actualizar"
        okButtonProps={{ danger: true, disabled: planned.length === 0 || applying || serviceReady !== true }}
        cancelText="Cancelar"
        onCancel={() => setConfirmOpen(false)}
        onOk={() => void applyAll()}
        closable={!applying}
      >
        <Typography.Paragraph>
          Se cambiará el stock de <strong>{planned.length} variantes visibles</strong> de Tiendanube, solo para los colores y talles indicados.
          Los productos ocultos y los talles sin número nuevo no serán modificados.
        </Typography.Paragraph>
        <div style={{ display: "grid", gap: 8 }}>
          {changeSummary.map((item) => (
            <div key={item.key}>
              <Typography.Text strong>{item.color} / {item.size}</Typography.Text>
              {" → " + item.stock + " unidades en " + item.variants + " variantes"}
            </div>
          ))}
        </div>
        <Alert style={{ marginTop: 16 }} type="warning" showIcon
          message="Esta operación modifica stock real."
          description="No se modificarán precios, SKU, colores ni nombres de talles. Se comprobará nuevamente cada variante antes de aplicarla."
        />
      </Modal>
    </main>
  );
}
