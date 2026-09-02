"use client";

import {
  Alert,
  Button,
  Card,
  Checkbox,
  Form,
  Input,
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
  const [creationResult, setCreationResult] = useState<SimilarPublicationCreationResult | null>(null);
  const [tiendanube, setTiendanube] = useState<TiendanubePublishResult>({ status: "NOT_REQUESTED" });
  const replicationOptionsRef = useRef<ReplicationOptions | null>(null);
  const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialValues = createInitialSimilarPublicationValues(draft);
  const storageKey = `similar-publication-draft:${draft.sourceKey}`;
  const [savedDraft, setSavedDraft] =
    useState<SimilarPublicationFormValues | null>(null);
  const [restoreOpen, setRestoreOpen] = useState(false);

  useEffect(() => {
    try {
      const raw = window.sessionStorage.getItem(storageKey);
      if (!raw) return;

      const parsed = JSON.parse(raw);

      if (
        parsed?.version === 1 &&
        parsed?.values &&
        typeof parsed.values === "object"
      ) {
        setSavedDraft(parsed.values as SimilarPublicationFormValues);
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

  const scheduleAutosave = (values: SimilarPublicationFormValues) => {
    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
    }

    autosaveTimerRef.current = setTimeout(() => {
      window.sessionStorage.setItem(
        storageKey,
        JSON.stringify({
          version: 1,
          savedAt: new Date().toISOString(),
          values,
        }),
      );
    }, 500);
  };

  const restoreSavedDraft = () => {
    if (savedDraft) {
      form.setFieldsValue(savedDraft);
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
          <Form.Item label="Categoría" name="categoryId" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item label="Moneda" name="currencyId" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item label="Tipo de publicación" name="listingTypeId" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item label="Modo de compra" name="buyingMode" rules={[{ required: true }]}><Input /></Form.Item>
        </div>
        <Form.Item label="Descripción" name="description"><Input.TextArea rows={5} /></Form.Item>
      </Card>

      <Card title="Fotos nuevas">
        <Typography.Paragraph type="secondary">
          Las fotos originales no se copian. Subí archivos JPG, JPEG o PNG de hasta 10 MB.
        </Typography.Paragraph>
        <SimilarPublicationImages
          onChange={setCommonPictures}
          onUploadingChange={updateUploading}
          pictures={commonPictures}
          uploadAction={uploadAction}
        />
      </Card>

      <Card title="Variantes">
        <SimilarPublicationVariants
          onPicturesChange={(sourceReference, pictures) => setVariantPictures((current) => ({
            ...current,
            [sourceReference]: pictures,
          }))}
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

function stageLabel(stage: PublishStage): string {
  if (stage === "PUBLISHING_ML") return "Publicando en Mercado Libre...";
  if (stage === "REPLICATING_TN") return "Replicando en Tienda Nube...";
  return "";
}
