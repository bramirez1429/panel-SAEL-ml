import { Card, Skeleton } from "antd";

export default function Loading() {
  return <div aria-label="Cargando publicaciones para replicar">{Array.from({ length: 8 }, (_, index) => <Card key={index} style={{ marginBottom: 12 }}><Skeleton active avatar paragraph={{ rows: 2 }} /></Card>)}</div>;
}
