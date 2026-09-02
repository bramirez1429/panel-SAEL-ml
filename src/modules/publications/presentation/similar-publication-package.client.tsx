"use client";

import { Form, InputNumber, Typography } from "antd";

import styles from "./similar-publication-form.module.css";

export function SimilarPublicationPackage() {
  return (
    <>
      <Typography.Paragraph type="secondary">
        Ingresá las medidas del paquete listo para despachar. Se enviarán a
        Mercado Libre cuando la categoría permita esos atributos.
      </Typography.Paragraph>

      <div className={styles.packageFields}>
        <Form.Item
          label="Ancho (cm)"
          name={["package", "widthCm"]}
          rules={[
            {
              type: "number",
              min: 1,
              message: "Ingresá un ancho mayor a 0.",
            },
          ]}
        >
          <InputNumber min={1} precision={0} style={{ width: "100%" }} />
        </Form.Item>

        <Form.Item
          label="Alto (cm)"
          name={["package", "heightCm"]}
          rules={[
            {
              type: "number",
              min: 1,
              message: "Ingresá un alto mayor a 0.",
            },
          ]}
        >
          <InputNumber min={1} precision={0} style={{ width: "100%" }} />
        </Form.Item>

        <Form.Item
          label="Profundidad (cm)"
          name={["package", "lengthCm"]}
          rules={[
            {
              type: "number",
              min: 1,
              message: "Ingresá una profundidad mayor a 0.",
            },
          ]}
        >
          <InputNumber min={1} precision={0} style={{ width: "100%" }} />
        </Form.Item>

        <Form.Item
          label="Peso (kg)"
          name={["package", "weightKg"]}
          rules={[
            {
              type: "number",
              min: 0.001,
              message: "Ingresá un peso mayor a 0.",
            },
          ]}
        >
          <InputNumber
            min={0.001}
            precision={3}
            step={0.1}
            style={{ width: "100%" }}
          />
        </Form.Item>
      </div>
    </>
  );
}
