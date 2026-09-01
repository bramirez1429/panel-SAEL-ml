import { Space, Spin } from "antd";

export default function SimilarPublicationLoading() {
  return (
    <Space style={{ marginTop: 32 }}>
      <Spin />
      <span>Cargando publicación...</span>
    </Space>
  );
}
