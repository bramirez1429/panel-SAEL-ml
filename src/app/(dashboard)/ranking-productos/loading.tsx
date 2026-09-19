import { Card, Skeleton } from 'antd';

export default function Loading() {
  return <Card title="Ranking de productos"><Skeleton active paragraph={{ rows: 8 }} /></Card>;
}
