"use client";

import { PlusOutlined } from "@ant-design/icons";
import { message, Upload, type UploadFile, type UploadProps } from "antd";
import { useState } from "react";
import type { SimilarPublicationPicture } from "../domain/similar-publication.model";
import type { UploadSimilarPublicationPictureAction } from "./similar-publication-action.types";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png"]);

type Props = Readonly<{
  pictures: readonly SimilarPublicationPicture[];
  onChange: (pictures: readonly SimilarPublicationPicture[]) => void;
  uploadAction: UploadSimilarPublicationPictureAction;
  onUploadingChange: (uploading: boolean) => void;
  compact?: boolean;
  display?: "picture-card" | "upload-only";
  uploadButtonLabel?: string;
}>;

export function SimilarPublicationImages({
  pictures,
  onChange,
  uploadAction,
  onUploadingChange,
  compact = false,
  display = "picture-card",
  uploadButtonLabel = "Agregar",
}: Props) {
  const [messageApi, contextHolder] = message.useMessage();
  const [uploading, setUploading] = useState(false);
  const fileList: UploadFile[] = pictures.map((picture) => ({
    uid: picture.id,
    name: picture.id,
    status: "done",
    url: picture.secureUrl,
  }));

  const customRequest: UploadProps["customRequest"] = async ({
    file,
    onError,
    onSuccess,
  }) => {
    if (!(file instanceof File)) {
      onError?.(new Error("La imagen seleccionada es inválida."));
      return;
    }
    setUploading(true);
    onUploadingChange(true);
    const formData = new FormData();
    formData.append("file", file, file.name);
    try {
      const result = await uploadAction(formData);
      if (!result.ok) {
        const error = new Error(result.message);
        onError?.(error);
        messageApi.error(result.message);
        return;
      }
      onChange([...pictures, result.picture]);
      onSuccess?.({}, file);
      messageApi.success("Imagen subida.");
    } catch (cause: unknown) {
      const message =
        cause instanceof Error && cause.message.trim()
          ? cause.message
          : "No se pudo subir la imagen.";

      const error =
        cause instanceof Error ? cause : new Error(message);

      console.error("[Publicar similar] Error subiendo imagen:", cause);
      onError?.(error);
      messageApi.error(message);
    } finally {
      setUploading(false);
      onUploadingChange(false);
    }
  };

  return (
    <>
      {contextHolder}
      <Upload
        accept=".jpg,.jpeg,.png"
        beforeUpload={(file) => validateFile(file, messageApi)}
        customRequest={customRequest}
        fileList={fileList}
        listType="picture-card"
        showUploadList={display === "picture-card"}
        onRemove={(file) => {
          onChange(pictures.filter(({ id }) => id !== file.uid));
          return true;
        }}
      >
        <span aria-label="Agregar foto nueva">
          <PlusOutlined />
          {!compact ? <span style={{ display: "block", marginTop: 6 }}>{uploadButtonLabel}</span> : null}
        </span>
      </Upload>
      {uploading ? <span>Subiendo imagen...</span> : null}
    </>
  );
}

function validateFile(
  file: File,
  messageApi: ReturnType<typeof message.useMessage>[0],
): boolean | typeof Upload.LIST_IGNORE {
  if (!ALLOWED_TYPES.has(file.type.toLowerCase())) {
    messageApi.error("La imagen debe ser JPG, JPEG o PNG.");
    return Upload.LIST_IGNORE;
  }
  if (file.size <= 0 || file.size > MAX_FILE_SIZE) {
    messageApi.error("La imagen debe pesar como máximo 10 MB.");
    return Upload.LIST_IGNORE;
  }
  return true;
}
