import { Card, Statistic } from "antd";

import type { PublicationVariantSummaryModel } from "./publication-variant-card.model";
import styles from "./publication-detail-view.module.css";

type Props = Readonly<{ summary: PublicationVariantSummaryModel }>;

export function PublicationVariantSummary({ summary }: Props) {
  const statistics = [
    { label: "Colores", value: summary.colors },
    { label: "Variantes / talles", value: summary.variants },
    { label: "Imágenes", value: summary.images },
    { label: "Unidades", value: summary.units },
  ];

  return (
    <section className={styles.summaryGrid} aria-label="Resumen de variantes">
      {statistics.map(({ label, value }) => (
        <Card className={styles.summaryCard} key={label} size="small">
          <Statistic title={label} value={value} />
        </Card>
      ))}
    </section>
  );
}
