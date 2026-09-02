"use client";

import {
  Alert,
  Button,
  Card,
  Checkbox,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Space,
  Spin,
  Typography,
} from "antd";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { ReplicationOptions, TiendanubeCategory } from "@/modules/tiendanube/domain/tiendanube-replication.model";
import type { ReplicatePublicationAction } from "@/modules/tiendanube/presentation/tiendanube-replication-cell.client";
import type {
  SimilarPublicationCreationResult,
  SimilarPublicationDraft,
  SimilarPublicationPicture,
} from "../domain/similar-publication.model";
import type {
  CreateSimilarPublicationAction,
  UploadSimilarPublicationPictureAction,
} from "./similar-publication-action.types";
import {
  buildSimilarPublicationInput,
  commonPriceForDraft,
  createInitialSimilarPublicationValues,
  familyNameIsUnchanged,
  type SimilarPublicationFormValues,
  type VariantPictures,
  variantsWithoutPictures,
} from "./similar-publication-form.model";
import { SimilarPublicationImages } from "./similar-publication-images.client";
import { SimilarPublicationPackage } from "./similar-publication-package.client";
import { SimilarPublicationResult, type TiendanubePublishResult } from "./similar-publication-result";
import { SimilarPublicationVariants } from "./similar-publication-variants.client";
import styles from "./similar-publication-form.module.css";

type Props = Readonly<{
  draft: SimilarPublicationDraft;
  returnTo: string;
  categories: readonly TiendanubeCategory[];
  createAction: CreateSimilarPublicationAction;
  uploadAction: UploadSimilarPublicationPictureAction;
  replicateAction: ReplicatePublicationAction;
}>;

type PublishStage = "IDLE" | "PUBLISHING_ML" | "REPLICATING_TN";

type SavedSimilarPublicationDraft = Readonly<{
  values: SimilarPublicationFormValues;
  commonPictures: readonly SimilarPublicationPicture[];
  variantPictures: VariantPictures;
}>;

export function SimilarPublicationForm({
  draft,
  returnTo,
  categories,
  createAction,
  uploadAction,
  replicateAction,
}: Props) {
  const router = useRouter();
  const [form] = Form.useForm<SimilarPublicationFormValues>();
  const submittingRef = useRef(false);
  const [stage, setStage] = useState<PublishStage>("IDLE");
  const [error, setError] = useState<string | null>(null);
  const [pendingUploads, setPendingUploads] = useState(0);
  const [commonPictures, setCommonPictures] = useState<readonly SimilarPublicationPicture[]>([]);
  const [variantPictures, setVariantPictures] = useState<VariantPictures>({});
  const commonPicturesRef = useRef<readonly SimilarPublicationPicture[]>([]);
  const variantPicturesRef = useRef<VariantPictures>({});
  const [creationResult, setCreationResult] = useState<SimilarPublicationCreationResult | null>(null);
  const [tiendanube, setTiendanube] = useState<TiendanubePublishResult>({ status: "NOT_REQUESTED" });
  const replicationOptionsRef = useRef<ReplicationOptions | null>(null);
  const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialValues = createInitialSimilarPublicationValues(draft);
  const commonPrice = commonPriceForDraft(draft);
  const storageKey = `similar-publication-draft:${draft.sourceKey}`;
  const [savedDraft, setSavedDraft] =
    useState<SavedSimilarPublicationDraft | null>(null);
  const [restoreOpen, setRestoreOpen] = useState(false);

  useEffect(() => {
    try {
      const raw = window.sessionStorage.getItem(storageKey);
      if (!raw) return;

      const parsed = JSON.parse(raw);

      if (
        parsed?.version === 2 &&
        parsed?.values &&
        typeof parsed.values === "object"
      ) {
        setSavedDraft({
          values: parsed.values as SimilarPublicationFormValues,
          commonPictures: Array.isArray(parsed.commonPictures)
            ? parsed.commonPictures as readonly SimilarPublicationPicture[]
            : [],
          variantPictures:
            parsed.variantPictures &&
            typeof parsed.variantPictures === "object"
              ? parsed.variantPictures as VariantPictures
              : {},
        });
        setRestoreOpen(true);
        return;
      }

      if (
        parsed?.version === 1 &&
        parsed?.values &&
        typeof parsed.values === "object"
      ) {
        setSavedDraft({
          values: parsed.values as SimilarPublicationFormValues,
          commonPictures: [],
          variantPictures: {},
        });
        setRestoreOpen(true);
      }
    } catch {
      window.sessionStorage.removeItem(storageKey);
    }
  }, [storageKey]);

  useEffect(() => {
    return () => {
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
      }
    };
  }, []);

  const scheduleAutosave = (
    values: SimilarPublicationFormValues,
    nextCommonPictures = commonPicturesRef.current,
    nextVariantPictures = variantPicturesRef.current,
  ) => {
    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
    }

    autosaveTimerRef.current = setTimeout(() => {
      window.sessionStorage.setItem(
        storageKey,
        JSON.stringify({
          version: 2,
          savedAt: new Date().toISOString(),
          values,
          commonPictures: nextCommonPictures,
          variantPictures: nextVariantPictures,
        }),
      );
    }, 500);
  };

  const restoreSavedDraft = () => {
    if (savedDraft) {
      form.setFieldsValue(savedDraft.values);

      commonPicturesRef.current = savedDraft.commonPictures;
      variantPicturesRef.current = savedDraft.variantPictures;

      setCommonPictures(savedDraft.commonPictures);
      setVariantPictures(savedDraft.variantPictures);
    }

    setRestoreOpen(false);
  };

  const discardSavedDraft = () => {
    window.sessionStorage.removeItem(storageKey);
    setSavedDraft(null);
    setRestoreOpen(false);
  };

  const clearSavedDraft = () => {
    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
      autosaveTimerRef.current = null;
    }

    window.sessionStorage.removeItem(storageKey);
    setSavedDraft(null);
  };

  const updateUploading = (uploading: boolean) => {
    setPendingUploads((current) => Math.max(0, current + (uploading ? 1 : -1)));
  };

  const updateCommonPictures = (
    pictures: readonly SimilarPublicationPicture[],
  ) => {
    commonPicturesRef.current = pictures;
    setCommonPictures(pictures);

    scheduleAutosave(
      form.getFieldsValue(true) as SimilarPublicationFormValues,
      pictures,
      variantPicturesRef.current,
    );
  };

  const updateVariantPictures = (
    sourceReference: string,
    pictures: readonly SimilarPublicationPicture[],
  ) => {
    const next = {
      ...variantPicturesRef.current,
      [sourceReference]: pictures,
    };

    variantPicturesRef.current = next;
    setVariantPictures(next);

    scheduleAutosave(
      form.getFieldsValue(true) as SimilarPublicationFormValues,
      commonPicturesRef.current,
      next,
    );
  };

  const replicateNewPublication = async (
    newSourceKey: string,
    options: ReplicationOptions,
  ) => {
    setStage("REPLICATING_TN");
    setTiendanube({ status: "PUBLISHING" });
    const result = await replicateAction(newSourceKey, options);
    setTiendanube(result.ok
      ? { status: "SUCCESS" }
      : { status: "ERROR", message: result.message });
    setStage("IDLE");
  };

  const publish = async () => {
    if (submittingRef.current) return;
    setError(null);
    let values: SimilarPublicationFormValues;
    try {
      values = await form.validateFields();
    } catch {
      return;
    }
    if (pendingUploads > 0) {
      setError("Esperá a que terminen de subirse todas las imágenes.");
      return;
    }
    if (variantsWithoutPictures(draft, commonPictures, variantPictures).length > 0) {
      setError("Asigná al menos una foto nueva a cada variante.");
      return;
    }
    if (submittingRef.current) return;
    submittingRef.current = true;
    setStage("PUBLISHING_ML");
    try {
      const input = buildSimilarPublicationInput(draft, values, commonPictures, variantPictures);
      const created = await createAction(input);
      if (!created.ok) {
        setError(created.message);
        return;
      }
      setCreationResult(created.result);

      if (created.result.status === "SUCCESS") {
        clearSavedDraft();
      }

      const categoryId = values.tiendanubeCategoryId;
      if (values.publishToTiendanube && categoryId !== undefined) {
        const options: ReplicationOptions = {
          priceMode: "KEEP_SOURCE",
          tagMode: "KEEP_SOURCE",
          categoryId,
        };
        replicationOptionsRef.current = options;
        if (created.result.status === "SUCCESS" && created.result.newSourceKey) {
          await replicateNewPublication(created.result.newSourceKey, options);
        } else {
          setTiendanube({
            status: "ERROR",
            message: "Tienda Nube no se ejecutó porque Mercado Libre no completó toda la publicación.",
          });
        }
      }
    } finally {
      submittingRef.current = false;
      setStage("IDLE");
    }
  };

  const retryTiendanube = async () => {
    const newSourceKey = creationResult?.newSourceKey;
    const options = replicationOptionsRef.current;
    if (submittingRef.current || !newSourceKey || !options) return;
    submittingRef.current = true;
    try {
      await replicateNewPublication(newSourceKey, options);
    } finally {
      submittingRef.current = false;
    }
  };

  if (creationResult) {
    return (
      <SimilarPublicationResult
        onRetryTiendanube={retryTiendanube}
        result={creationResult}
        returnTo={returnTo}
        tiendanube={tiendanube}
      />
    );
  }

  const loading = stage !== "IDLE";
  return (
    <Form
      className={styles.form}
      form={form}
      initialValues={initialValues}
      layout="vertical"
      onValuesChange={(_, values) => {
        scheduleAutosave(values as SimilarPublicationFormValues);
      }}
    >
      <Modal
        cancelText="Descartar"
        closable={false}
        maskClosable={false}
        okText="Restaurar"
        onCancel={discardSavedDraft}
        onOk={restoreSavedDraft}
        open={restoreOpen}
        title="Borrador encontrado"
      >
        <Typography.Paragraph>
          Encontramos cambios que habías hecho anteriormente en esta publicación.
        </Typography.Paragraph>
        <Typography.Text type="secondary">
          Podés restaurarlos o descartarlos y empezar nuevamente.
        </Typography.Text>
      </Modal>

      <Typography.Title level={2}>Publicar similar</Typography.Title>
      <Card title="Información general">
        <div className={styles.generalGrid}>
          {draft.sourceType === "USER_PRODUCT" ? (
            <Form.Item
              label="Nombre de familia"
              name="familyName"
              rules={[
                { required: true, message: "Ingresá un nombre de familia nuevo." },
                {
                  validator: (_, value: string | undefined) => familyNameIsUnchanged(value, draft.familyName)
                    ? Promise.reject(new Error("El nombre de familia debe ser distinto al original."))
                    : Promise.resolve(),
                },
              ]}
            >
              <Input />
            </Form.Item>
          ) : (
            <Form.Item label="Título" name="titleTemplate" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
          )}
          {draft.sourceType === "USER_PRODUCT" ? (
            <Typography.Text type="secondary">Mercado Libre generará el título final.</Typography.Text>
          ) : null}
          <Form.Item name="categoryId" hidden rules={[{ required: true }]}>
            <Input />
          </Form.Item>

          <div className={styles.readOnlyField}>
            <Typography.Text type="secondary">Categoría</Typography.Text>
            <Typography.Text strong>
              {draft.categoryId ?? "Sin categoría"}
            </Typography.Text>
          </div>

          <Form.Item name="currencyId" hidden rules={[{ required: true }]}>
            <Input />
          </Form.Item>

          <div className={styles.readOnlyField}>
            <Typography.Text type="secondary">Moneda</Typography.Text>
            <Typography.Text strong>
              {currencyLabel(draft.currencyId)}
            </Typography.Text>
          </div>

          <Form.Item name="listingTypeId" hidden rules={[{ required: true }]}>
            <Input />
          </Form.Item>

          <div className={styles.readOnlyField}>
            <Typography.Text type="secondary">
              Tipo de publicación
            </Typography.Text>
            <Typography.Text strong>
              {listingTypeLabel(draft.listingTypeId)}
            </Typography.Text>
          </div>

          <Form.Item name="buyingMode" hidden rules={[{ required: true }]}>
            <Input />
          </Form.Item>
        </div>
        <Form.Item label="Descripción" name="description"><Input.TextArea rows={5} /></Form.Item>
      </Card>

      <Card title="Fotos nuevas">
        <Typography.Paragraph type="secondary">
          Las fotos originales no se copian. Subí archivos JPG, JPEG o PNG de hasta 10 MB.
        </Typography.Paragraph>
        <SimilarPublicationImages
          onChange={updateCommonPictures}
          onUploadingChange={updateUploading}
          pictures={commonPictures}
          uploadAction={uploadAction}
        />
      </Card>

      <Card title="Variantes">
        {commonPrice !== null ? (
          <div className={styles.commonPrice}>
            <Form.Item
              label="Precio general"
              name="commonPrice"
              rules={[
                {
                  required: true,
                  type: "number",
                  min: 0.01,
                  message: "Ingresá un precio mayor a 0.",
                },
              ]}
            >
              <InputNumber
                min={0.01}
                precision={2}
                prefix="$"
                style={{ width: "100%" }}
              />
            </Form.Item>

            <Typography.Text type="secondary">
              Este precio se aplicará a todas las variantes.
            </Typography.Text>
          </div>
        ) : null}

        <SimilarPublicationVariants
          showPriceColumn={commonPrice === null}
          onPicturesChange={updateVariantPictures}
          onUploadingChange={updateUploading}
          picturesByVariant={variantPictures}
          uploadAction={uploadAction}
          variants={draft.variants}
        />
      </Card>

      <Card title="Medidas del paquete">
        <SimilarPublicationPackage />
      </Card>

      <Card title="Publicar en">
        <Space orientation="vertical">
          <Checkbox checked disabled>Mercado Libre</Checkbox>
          <Form.Item name="publishToTiendanube" valuePropName="checked" noStyle>
            <Checkbox>Tienda Nube</Checkbox>
          </Form.Item>
          <Form.Item noStyle shouldUpdate={(previous, current) => previous.publishToTiendanube !== current.publishToTiendanube}>
            {({ getFieldValue }) => getFieldValue("publishToTiendanube") ? (
              <Form.Item
                label="Categoría de Tienda Nube"
                name="tiendanubeCategoryId"
                rules={[{ required: true, message: "Seleccioná una categoría de Tienda Nube." }]}
              >
                <Select
                  options={categories.map(({ id, name }) => ({ label: name, value: id }))}
                  placeholder="Seleccionar categoría"
                />
              </Form.Item>
            ) : null}
          </Form.Item>
        </Space>
      </Card>

      {error ? <Alert message={error} showIcon type="error" /> : null}
      {loading ? (
        <div className={styles.loading}><Spin /><span>{stageLabel(stage)}</span></div>
      ) : null}
      <div className={styles.actions}>
        <Button disabled={loading} onClick={() => router.push(returnTo)}>Cancelar</Button>
        <Button disabled={pendingUploads > 0} loading={loading} onClick={publish} type="primary">
          Publicar
        </Button>
      </div>
    </Form>
  );
}

function currencyLabel(currencyId: string | null): string {
  if (currencyId === "ARS") return "ARS - Peso argentino";
  if (currencyId === "USD") return "USD - Dólar estadounidense";

  return currencyId ?? "Sin moneda";
}

function listingTypeLabel(listingTypeId: string | null): string {
  const labels: Readonly<Record<string, string>> = {
    gold_pro: "Premium",
    gold_special: "Clásica",
    gold_premium: "Premium",
    gold: "Oro",
    silver: "Plata",
    bronze: "Bronce",
    free: "Gratuita",
  };

  if (!listingTypeId) {
    return "Sin tipo de publicación";
  }

  return labels[listingTypeId] ?? listingTypeId;
}

function stageLabel(stage: PublishStage): string {
  if (stage === "PUBLISHING_ML") return "Publicando en Mercado Libre...";
  if (stage === "REPLICATING_TN") return "Replicando en Tienda Nube...";
  return "";
}
