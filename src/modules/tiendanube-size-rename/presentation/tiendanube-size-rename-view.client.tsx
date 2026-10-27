"use client";

import { Alert, Button, Card, Input, Space, Spin, Statistic, Tag, Typography } from "antd";
import { useMemo, useRef, useState } from "react";

import type { TiendanubeProduct } from "@/modules/tiendanube/domain/tiendanube-products.model";
import type { LoadSizeCatalogResult } from "@/app/(dashboard)/tiendanube/talles-masivos/actions";
import {
  availableSizes,
  groupSizesByColor,
  previewSizeChanges,
  type SizeRenameMapping,
} from "../domain/size-rename-preview";

type Props = Readonly<{
  loadPageAction(search: string, page: number): Promise<LoadSizeCatalogResult>;
}>;

// Never silently present a partial catalog as a complete global operation.
const MAX_SCAN_PAGES = 200;

export function TiendanubeSizeRenameView({ loadPageAction }: Props) {
  const [query, setQuery] = useState("buzo de mujer");
  const [searchedQuery, setSearchedQuery] = useState("");
  const [products, setProducts] = useState<readonly TiendanubeProduct[]>([]);
  const [mapping, setMapping] = useState<SizeRenameMapping>({});
  const [loading, setLoading] = useState(false);
  const [scannedPages, setScannedPages] = useState(0);
  const [scannedProducts, setScannedProducts] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const requestVersion = useRef(0);

  const sizes = useMemo(() => availableSizes(products), [products]);
  const colorGroups = useMemo(() => groupSizesByColor(products), [products]);
  const preview = useMemo(() => previewSizeChanges(products, mapping), [products, mapping]);
  const variantCount = useMemo(() => products.reduce((total, product) =>
    total + product.variants.length, 0), [products]);

  async function searchAll(input: string): Promise<void> {
    const search = input.trim();
    if (search.length < 2 || search.length > 80) {
      setError("Ingresá una búsqueda de 2 a 80 caracteres.");
      return;
    }

    const version = ++requestVersion.current;
    setLoading(true);
    setError(null);
    setProducts([]);
    setMapping({});
    setScannedPages(0);
    setScannedProducts(0);
    setSearchedQuery("");
    setShowPreview(false);

    try {
      const allProducts = new Map<string, TiendanubeProduct>();
      let completed = false;

      for (let page = 1; page <= MAX_SCAN_PAGES; page++) {
        const response = await loadPageAction(search, page);
        if (version !== requestVersion.current) return;
        if (!response.ok) throw new Error(response.message);
        if (response.data.page !== page) {
          throw new Error("Tiendanube devolvió una página diferente de la solicitada.");
        }

        for (const product of response.data.products) {
          allProducts.set(product.id, product);
        }
        setScannedPages(page);
        setScannedProducts(allProducts.size);

        if (!response.data.hasMore) {
          completed = true;
          break;
        }
        if (response.data.products.length === 0) {
          throw new Error("Tiendanube indicó más páginas, pero no devolvió productos. No se puede garantizar el catálogo completo.");
        }
      }

      if (!completed) {
        throw new Error("La búsqueda supera el límite de seguridad de 200 páginas. No se realizará ningún cambio con resultados incompletos.");
      }
      if (version !== requestVersion.current) return;
      setProducts([...allProducts.values()]);
      setSearchedQuery(search);
    } catch (caught: unknown) {
      if (version !== requestVersion.current) return;
      setProducts([]);
      setSearchedQuery("");
      setError(caught instanceof Error ? caught.message : "No se pudo completar la búsqueda de todos los productos.");
    } finally {
      if (version === requestVersion.current) setLoading(false);
    }
  }

  function changeSize(size: string, nextSize: string): void {
    // One input per original size updates the mapping for every color/product.
    setMapping((current) => ({ ...current, [size]: nextSize }));
    setShowPreview(false);
  }

  const hasChanges = preview.changes.length > 0;

  return (
    <main style={{ display: "grid", gap: 18, width: "100%" }}>
      <header>
        <Typography.Title level={2}>Tiendanube — Talles masivos</Typography.Title>
        <Typography.Text type="secondary">
          Cambiá los nombres de talles de todos los productos que coincidan con una búsqueda, sin seleccionarlos uno por uno.
        </Typography.Text>
      </header>

      <Alert
        showIcon
        type="info"
        message="Versión de prueba — Solo lectura y previsualización"
        description="La actualización real de Tiendanube aún no está habilitada. Esta pantalla no modifica productos, stock, precios ni SKU."
      />

      <Card title="Buscar en todo el catálogo">
        <Space orientation="vertical" size="small" style={{ width: "100%" }}>
          <Input.Search
            aria-label="Buscar productos de Tiendanube"
            placeholder="Ej.: buzo de mujer, remera, campera..."
            enterButton="Buscar todos"
            size="large"
            loading={loading}
            disabled={loading}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onSearch={(value) => void searchAll(value)}
          />
          <Typography.Text type="secondary">
            El panel consulta automáticamente todas las páginas de Tiendanube. No es necesario elegir productos.
          </Typography.Text>
          {loading ? (
            <div aria-live="polite">
              <Typography.Text>
                Buscando todas las variantes… Página {scannedPages}; {scannedProducts} productos encontrados.
              </Typography.Text>
              <Spin size="small" />
            </div>
          ) : null}
          {error ? <Alert type="error" showIcon message={error} /> : null}
        </Space>
      </Card>

      {searchedQuery && !loading ? (
        <>
          <Card title={'Resultados completos: "' + searchedQuery + '"'}>
            <Space size="large" wrap>
              <Statistic title="Productos encontrados" value={products.length} />
              <Statistic title="Variantes encontradas" value={variantCount} />
              <Statistic title="Colores encontrados" value={colorGroups.length} />
              <Statistic title="Talles diferentes" value={sizes.length} />
            </Space>
            {products.length === 0 ? <Alert type="info" style={{ marginTop: 12 }}
              message="La búsqueda no encontró productos. Probá con un término más general." /> : null}
            {products.length > 0 && sizes.length === 0 ? (
              <Alert type="warning" style={{ marginTop: 12 }}
                message="Se encontraron productos, pero no tienen un atributo de talle reconocido." />
            ) : null}
          </Card>

          {colorGroups.length > 0 ? (
            <Card title="Variantes agrupadas por color">
              <Typography.Paragraph type="secondary">
                Todos los talles de cada color, incluso sin stock. Los inputs son globales: al cambiar un talle en un color, ese valor se replica automáticamente en los demás colores y productos encontrados.
              </Typography.Paragraph>
              <div style={{ display: "grid", gap: 12 }}>
                {colorGroups.map((group) => (
                  <section key={group.color} aria-label={"Color " + group.color}
                    style={{ padding: 14, border: "1px solid #e5eaf1", borderRadius: 8 }}>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap", marginBottom: 10 }}>
                      <Typography.Text strong style={{ fontSize: 16 }}>{group.color}</Typography.Text>
                      <Typography.Text type="secondary">
                        {group.products} productos · {group.variants} variantes
                      </Typography.Text>
                    </div>
                    <div style={{ display: "grid", gap: 8 }}>
                      <div style={{
                        display: "grid",
                        gridTemplateColumns: "minmax(80px, 130px) minmax(140px, 260px) minmax(60px, 90px)",
                        gap: 8,
                      }}>
                        <Typography.Text type="secondary">Talle actual</Typography.Text>
                        <Typography.Text type="secondary">Nuevo talle global</Typography.Text>
                        <Typography.Text type="secondary">Variantes</Typography.Text>
                      </div>
                      {group.sizes.map((item) => (
                        <div key={item.size} style={{
                          display: "grid",
                          gridTemplateColumns: "minmax(80px, 130px) minmax(140px, 260px) minmax(60px, 90px)",
                          gap: 8,
                          alignItems: "center",
                        }}>
                          <Typography.Text strong>{item.size}</Typography.Text>
                          <Input
                            aria-label={"Nuevo talle para " + item.size + " en " + group.color}
                            value={item.size === "Sin talle" ? "" : (mapping[item.size] ?? item.size)}
                            placeholder={item.size === "Sin talle" ? "Sin talle" : undefined}
                            disabled={item.size === "Sin talle"}
                            maxLength={40}
                            onChange={(event) => changeSize(item.size, event.target.value)}
                          />
                          <Tag>{item.variants}</Tag>
                        </div>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            </Card>
          ) : null}

          {sizes.length > 0 ? (
            <Card title="Revisión del cambio masivo">
              <Space orientation="vertical" size="middle" style={{ width: "100%" }}>
                <Space size="large" wrap>
                  <Statistic title="Productos incluidos" value={preview.selectedProducts} />
                  <Statistic title="Variantes revisadas" value={preview.selectedVariants} />
                  <Statistic title="Variantes a renombrar" value={preview.changes.length} />
                </Space>
                {preview.warnings.length > 0 ? (
                  <Alert type="error" showIcon
                    message={"Hay " + preview.warnings.length + " conflictos de talle"}
                    description={
                      <ul style={{ margin: 0, paddingLeft: 20 }}>
                        {preview.warnings.map((warning) => <li key={warning}>{warning}</li>)}
                      </ul>
                    }
                  />
                ) : null}
                <Button type="primary" disabled={!hasChanges || preview.warnings.length > 0}
                  onClick={() => setShowPreview(true)}>
                  Previsualizar cambio masivo
                </Button>
                {showPreview ? (
                  <>
                    <Alert showIcon type="success"
                      message={"Vista previa lista: " + preview.changes.length + " variantes cambiarían de talle."}
                      description="La selección corresponde a todos los productos encontrados, sin necesidad de editar cada uno."
                    />
                    <Button type="primary" disabled>
                      Cambiar masivamente (se habilitará en la etapa de guardado)
                    </Button>
                  </>
                ) : null}
              </Space>
            </Card>
          ) : null}
        </>
      ) : null}
    </main>
  );
}
