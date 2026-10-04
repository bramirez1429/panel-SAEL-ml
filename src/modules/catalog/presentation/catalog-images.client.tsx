"use client";

import { useEffect, useState, type ChangeEvent } from "react";
import { DeleteOutlined } from "@ant-design/icons";
import { Alert, Button, Card, Checkbox, Empty, Input, Popconfirm, Spin, message } from "antd";

import { catalogColors, type CatalogColor, type CatalogProduct } from "../domain/catalog.model";
import { createCatalogProduct, deleteCatalogProduct, getCatalogProducts, updateCatalogProductColors } from "../infrastructure/catalogApi";
import styles from "./catalog-images.module.css";

const colorLabels: Record<CatalogColor, string> = { rosa: "Rosa", lila: "Lila", blanco: "Blanco" };
const MAX_IMAGE_SIZE = 4 * 1024 * 1024;
const IMAGE_SIZE_ERROR = "La imagen es demasiado pesada. El tamaño máximo permitido es de 4 MB.";

export function CatalogImagesClient() {
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedColors, setSelectedColors] = useState<CatalogColor[]>([]);
  const [saving, setSaving] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [draftColors, setDraftColors] = useState<Record<string, CatalogColor[]>>({});
  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => { void loadProducts(); }, []);
  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl]);

  async function loadProducts() {
    setLoading(true); setError(null);
    try {
      const nextProducts = await getCatalogProducts();
      setProducts(nextProducts);
      setDraftColors(Object.fromEntries(nextProducts.map((product) => [product.id, product.colors])));
    } catch (cause) { setError(cause instanceof Error ? cause.message : "No se pudieron cargar las imágenes."); }
    finally { setLoading(false); }
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const nextFile = event.target.files?.[0] ?? null;
    if (nextFile && nextFile.size > MAX_IMAGE_SIZE) {
      event.target.value = ""; setFile(null); setPreviewUrl(null); messageApi.error(IMAGE_SIZE_ERROR); return;
    }
    setFile(nextFile); setPreviewUrl(nextFile ? URL.createObjectURL(nextFile) : null);
  }

  async function handleUpload() {
    if (!file || selectedColors.length === 0) return;
    if (file.size > MAX_IMAGE_SIZE) {
      setFile(null); setPreviewUrl(null);
      const input = document.getElementById("catalog-image-file") as HTMLInputElement | null;
      if (input) input.value = "";
      messageApi.error(IMAGE_SIZE_ERROR); return;
    }
    setSaving(true);
    try {
      await createCatalogProduct(name.trim(), file, selectedColors);
      messageApi.success("Imagen subida correctamente.");
      setName(""); setFile(null); setSelectedColors([]); setPreviewUrl(null);
      const input = document.getElementById("catalog-image-file") as HTMLInputElement | null;
      if (input) input.value = "";
      await loadProducts();
    } catch (cause) { messageApi.error(cause instanceof Error ? cause.message : "No se pudo subir la imagen."); }
    finally { setSaving(false); }
  }

  async function handleSaveColors(product: CatalogProduct) {
    const colors = draftColors[product.id] ?? [];
    if (colors.length === 0) return;
    setSavingId(product.id);
    try {
      await updateCatalogProductColors(product.id, colors);
      messageApi.success("Colores guardados correctamente.");
      setProducts((current) => current.map((item) => item.id === product.id ? { ...item, colors } : item));
    } catch (cause) { messageApi.error(cause instanceof Error ? cause.message : "No se pudieron guardar los colores."); }
    finally { setSavingId(null); }
  }

  async function handleDelete(product: CatalogProduct) {
    setDeletingId(product.id);
    try {
      await deleteCatalogProduct(product.id);
      setProducts((current) => current.filter((item) => item.id !== product.id));
      setDraftColors((current) => {
        const next = { ...current };
        delete next[product.id];
        return next;
      });
      messageApi.success("Imagen eliminada correctamente.");
    } catch (cause) { messageApi.error(cause instanceof Error ? cause.message : "No se pudo eliminar la imagen."); }
    finally { setDeletingId(null); }
  }

  const toggleColor = (colors: CatalogColor[], color: CatalogColor) => colors.includes(color) ? colors.filter((item) => item !== color) : [...colors, color];

  return <>
    {contextHolder}
    <Card className={styles.uploadSection} title="Subir nueva imagen">
      <div className={styles.uploadForm}>
        <div className={styles.formGrid}>
          <Input placeholder="Nombre del producto" value={name} onChange={(event) => setName(event.target.value)} aria-label="Nombre del producto" />
          <div><input id="catalog-image-file" type="file" accept="image/*" onChange={handleFileChange} /></div>
        </div>
        {file ? <div className={styles.preview}><img className={styles.previewImage} src={previewUrl ?? ""} alt="Preview de la imagen seleccionada" /><div className={styles.previewText}><strong>{file.name}</strong>{name.trim() ? <span>{name.trim()}</span> : null}</div></div> : null}
        <div><div>Colores disponibles:</div><div className={styles.colors}>{catalogColors.map((color) => <Checkbox key={color} checked={selectedColors.includes(color)} onChange={() => setSelectedColors((current) => toggleColor(current, color))}>{colorLabels[color]}</Checkbox>)}</div></div>
        <Button type="primary" loading={saving} disabled={!file || selectedColors.length === 0} onClick={() => void handleUpload()}>Subir imagen</Button>
      </div>
    </Card>
    <section className={styles.listSection} aria-labelledby="catalog-images-title">
      <h2 id="catalog-images-title">Imágenes actuales</h2>
      {error ? <Alert className={styles.error} type="error" message={error} showIcon /> : null}
      {loading ? <Spin /> : products.length === 0 ? <Empty description="Todavía no hay imágenes en el catálogo." /> : <div className={styles.grid}>{products.map((product) => {
        const colors = draftColors[product.id] ?? product.colors;
        return <Card key={product.id} cover={<img className={styles.productImage} src={product.image} alt={product.name} />} title={product.name}>
          <div>Colores disponibles</div>
          <div className={styles.cardColors}>{catalogColors.map((color) => <Checkbox key={color} checked={colors.includes(color)} onChange={() => setDraftColors((current) => ({ ...current, [product.id]: toggleColor(colors, color) }))}>{colorLabels[color]}</Checkbox>)}</div>
          <div className={styles.cardActions}>
            <Button type="primary" disabled={colors.length === 0} loading={savingId === product.id} onClick={() => void handleSaveColors(product)}>Guardar</Button>
            <Popconfirm title="¿Eliminar esta imagen?" description="Se eliminará del catálogo." okText="Eliminar" cancelText="Cancelar" onConfirm={() => void handleDelete(product)}>
              <Button danger icon={<DeleteOutlined />} loading={deletingId === product.id}>Borrar</Button>
            </Popconfirm>
          </div>
        </Card>;
      })}</div>}
    </section>
  </>;
}
