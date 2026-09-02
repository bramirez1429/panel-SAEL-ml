"use client";

import { InputNumber, Typography } from "antd";
import Image from "next/image";

import packageDimensionsReference from "@/images/package-dimensions-reference.png";

import styles from "./similar-publication-form.module.css";

export function SimilarPublicationPackage() {
  return (
    <>
      <Typography.Paragraph type="secondary">
        Usá esta referencia para identificar correctamente el ancho, alto,
        profundidad y peso del paquete.
      </Typography.Paragraph>

      <div className={styles.packageLayout}>
        <div className={styles.packageReference}>
          <Image
            alt="Referencia para medir ancho, alto y profundidad del paquete"
            className={styles.packageImage}
            src={packageDimensionsReference}
          />
        </div>

        <div className={styles.packageFields}>
          <PackageField label="Ancho" unit="cm" />
          <PackageField label="Alto" unit="cm" />
          <PackageField label="Profundidad" unit="cm" />
          <PackageField label="Peso" unit="g" />
        </div>
      </div>

      <Typography.Paragraph
        className={styles.packageNotice}
        type="secondary"
      >
        Estos campos se habilitarán cuando conectemos las reglas reales de
        Mercado Libre para la categoría. Por ahora son una referencia visual
        y no se envían al publicar.
      </Typography.Paragraph>
    </>
  );
}

function PackageField({
  label,
  unit,
}: Readonly<{
  label: string;
  unit: string;
}>) {
  return (
    <div className={styles.packageField}>
      <Typography.Text strong>{label}</Typography.Text>

      <InputNumber
        addonAfter={unit}
        disabled
        placeholder="—"
        style={{ width: "100%" }}
      />
    </div>
  );
}
