import { Card, Col, Row, Skeleton } from "antd";

import styles from "./loading.module.css";

export default function Loading() {
  return (
    <Row aria-label="Cargando publicaciones para replicar" gutter={[16, 16]}>
      {Array.from({ length: 8 }, (_, index) => (
        <Col key={index} xs={24} md={12} lg={8} xl={6}>
          <Card
            style={{ height: "100%", borderRadius: 16, overflow: "hidden" }}
            cover={<div className={styles.imageSkeleton} />}
            styles={{ body: { padding: "18px 20px" } }}
          >
            <Skeleton active title={{ width: "80%" }} paragraph={{ rows: 5, width: ["35%", "85%", "70%", "75%", "100%"] }} />
          </Card>
        </Col>
      ))}
    </Row>
  );
}
