"use client";

import { Alert, Collapse, List, Space, Typography } from "antd";

import type { PublicationPromotionResult } from "../domain/publication-promotion.model";
import { promotionErrorMessage } from "./promotion-error.mapper";

type Props = Readonly<{
  result: PublicationPromotionResult;
  operation: "apply" | "deactivate";
}>;

export function PromotionExecutionStatus({ result, operation }: Props) {
  const action = operation === "apply" ? "aplicó" : "desactivó";
  const successLabel = operation === "apply" ? "aplicadas" : "desactivadas";
  const failed = result.results.filter((item) => !item.success);
  return (
    <Alert
      type="warning"
      showIcon
      message={`Se ${action} en ${result.successfulItems} de ${result.totalItems} variantes.`}
      description={
        <Space direction="vertical" style={{ width: "100%" }}>
          <Typography.Text>{`✓ ${result.successfulItems} ${successLabel}`}</Typography.Text>
          <Typography.Text type="danger">{`✕ ${result.failedItems} con error`}</Typography.Text>
          {failed.length > 0 ? (
            <Collapse
              size="small"
              items={[
                {
                  key: "failed-items",
                  label: "Ver MLA afectados",
                  children: (
                    <List
                      size="small"
                      dataSource={failed}
                      renderItem={(item) => (
                        <List.Item>
                          <Space direction="vertical" size={0}>
                            <Typography.Text>{item.itemId}</Typography.Text>
                            <Typography.Text type="secondary">
                              {promotionErrorMessage(item.errorCode)}
                            </Typography.Text>
                            {item.errorCode ? (
                              <Typography.Text type="secondary">
                                {`Referencia: ${item.errorCode}`}
                              </Typography.Text>
                            ) : null}
                          </Space>
                        </List.Item>
                      )}
                    />
                  ),
                },
              ]}
            />
          ) : null}
        </Space>
      }
    />
  );
}
