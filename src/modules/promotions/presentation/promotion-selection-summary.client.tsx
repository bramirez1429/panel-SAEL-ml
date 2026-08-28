"use client";

import { Button, List, Modal, Space, Typography } from "antd";
import { useState } from "react";

import { usePromotionGlobalStore } from "./promotion-global.store";

export function PromotionSelectionSummary() {
  const [open, setOpen] = useState(false);
  const selectionsByKey = usePromotionGlobalStore((state) => state.selections);
  const selections = Object.values(selectionsByKey);

  if (selections.length === 0) return null;

  return <>
    <Space style={{ marginBottom: 16 }}>
      <Typography.Text strong>{selections.length} {selections.length === 1 ? "promoción seleccionada" : "promociones seleccionadas"}</Typography.Text>
      <Button type="primary" onClick={() => setOpen(true)}>Participar en las seleccionadas</Button>
    </Space>
    <Modal
      title="Promociones seleccionadas"
      open={open}
      onCancel={() => setOpen(false)}
      footer={<Button onClick={() => setOpen(false)}>Cerrar</Button>}
    >
      <List
        dataSource={selections}
        renderItem={(selection) => <List.Item>
          <List.Item.Meta
            title={selection.option.name ?? "Promoción de Mercado Libre"}
            description={`${selection.publicationTitle} · ${selection.itemId}`}
          />
        </List.Item>}
      />
    </Modal>
  </>;
}
