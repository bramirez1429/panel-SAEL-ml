"use client";

import { Alert, Button, Form, InputNumber, Select, Space, Typography } from "antd";
import { useState } from "react";

import {
  removeUnselectedQuantities,
  validateBulkStockForm,
  type BulkStockFormValues,
} from "../application/bulk-stock.validation";
import { BULK_STOCK_SIZE_OPTIONS_BY_TYPE } from "../bulk-stock.config";
import type { BulkStockPreviewRequest, BulkStockProductType } from "../domain/bulk-stock.model";

type BulkStockFormProps = Readonly<{
  loading: boolean;
  error: string | null;
  onSubmit: (request: BulkStockPreviewRequest) => void;
}>;

export function BulkStockForm({ loading, error, onSubmit }: BulkStockFormProps) {
  const [values, setValues] = useState<BulkStockFormValues>({
    productType: null,
    sizes: [],
    quantityBySize: {},
  });
  const [fieldErrors, setFieldErrors] = useState<Readonly<Record<string, string>>>({});

  const selectSizes = (sizes: string[]) => {
    setValues((current) => ({
      ...current,
      sizes,
      quantityBySize: removeUnselectedQuantities(current.quantityBySize, sizes),
    }));
    setFieldErrors((current) => withoutStockErrors(current, sizes));
  };

  const submit = () => {
    const validation = validateBulkStockForm(values);
    if (!validation.valid) {
      setFieldErrors(validation.fieldErrors);
      return;
    }
    setFieldErrors({});
    onSubmit(validation.request);
  };

  const sizeOptions = values.productType
    ? BULK_STOCK_SIZE_OPTIONS_BY_TYPE[values.productType]
    : [];

  return (
    <Form layout="vertical" onFinish={submit} style={{ maxWidth: 760 }}>
      {error ? <Alert message={error} showIcon style={{ marginBottom: 20 }} type="error" /> : null}
      <Form.Item
        help={fieldErrors.productType}
        label="Tipo"
        required
        validateStatus={fieldErrors.productType ? "error" : undefined}
      >
        <Select
          aria-label="Tipo"
          options={[...productTypeOptions]}
          placeholder="Seleccionar tipo"
          value={values.productType ?? undefined}
          onChange={(productType: BulkStockProductType) => {
            setValues({ productType, sizes: [], quantityBySize: {} });
            setFieldErrors({});
          }}
        />
      </Form.Item>

      <Form.Item
        help={fieldErrors.sizes}
        label="Talles"
        required
        validateStatus={fieldErrors.sizes ? "error" : undefined}
      >
        <Select
          aria-label="Talles"
          disabled={!values.productType}
          mode="multiple"
          options={[...sizeOptions]}
          placeholder={values.productType ? "Seleccionar talles" : "Primero seleccioná un tipo"}
          value={[...values.sizes]}
          onChange={selectSizes}
        />
      </Form.Item>

      {values.sizes.length > 0 ? (
        <Space direction="vertical" size={12} style={{ display: "flex", marginBottom: 24 }}>
          <Typography.Title level={5} style={{ margin: 0 }}>Stock por talle</Typography.Title>
          {values.sizes.map((size) => {
            const errorMessage = fieldErrors[`quantity.${size}`];
            const sizeOption = sizeOptions.find((option) => option.value === size);
            const sizeLabel = sizeOption?.label ?? size;
            return (
              <Form.Item
                help={errorMessage}
                key={size}
                label={`Talle ${sizeLabel}`}
                required
                style={{ marginBottom: errorMessage ? 8 : 0 }}
                validateStatus={errorMessage ? "error" : undefined}
              >
                <InputNumber
                  aria-label={`Stock para talle ${sizeLabel}`}
                  min={0}
                  precision={0}
                  style={{ width: 180 }}
                  value={values.quantityBySize[size] ?? null}
                  onChange={(quantity) => setValues((current) => ({
                    ...current,
                    quantityBySize: { ...current.quantityBySize, [size]: quantity },
                  }))}
                />
              </Form.Item>
            );
          })}
        </Space>
      ) : null}

      <Button htmlType="submit" loading={loading} type="primary">
        Buscar variantes
      </Button>
    </Form>
  );
}

const productTypeOptions: readonly Readonly<{ label: string; value: BulkStockProductType }>[] = [
  { label: "Buzo mujer", value: "BUZO_MUJER" },
  { label: "Buzo nena", value: "BUZO_NENA" },
  { label: "Remera mujer", value: "REMERA_MUJER" },
  { label: "Remera nena", value: "REMERA_NENA" },
];

function withoutStockErrors(
  errors: Readonly<Record<string, string>>,
  sizes: readonly string[],
): Readonly<Record<string, string>> {
  const selected = new Set(sizes);
  return Object.fromEntries(Object.entries(errors).filter(([key]) => (
    !key.startsWith("quantity.") || selected.has(key.slice("quantity.".length))
  )));
}
