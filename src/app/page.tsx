import { Button, Tag } from "antd";

import { PageContainer } from "@/shared/ui/page-container/page-container";

export default function Home() {
  return (
    <PageContainer className="page">
      <section className="panel" aria-labelledby="panel-title">
        <Tag color="success">Ant Design listo</Tag>
        <h1 id="panel-title">Panel</h1>
        <p>Frontend funcionando correctamente</p>
        <Button type="primary">Comprobación visual</Button>
      </section>
    </PageContainer>
  );
}
