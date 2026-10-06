"use client";

import { EyeOutlined } from "@ant-design/icons";
import { Skeleton, Typography } from "antd";

import styles from "./replication-list.module.css";

type Props = Readonly<{
  visits?: number | null;
}>;

export function ReplicationVisits({ visits }: Props) {
  if (visits === undefined) {
    return <Skeleton active title={false} paragraph={{ rows: 1, width: "45%" }} className={styles.visitsSkeleton} />;
  }

  return <Typography.Text type="secondary" className={styles.visits}>
    <EyeOutlined /> {visits === null ? "Vistas no disponibles" : `${new Intl.NumberFormat("es-AR").format(visits)} vistas`}
  </Typography.Text>;
}
