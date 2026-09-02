import { Card, Statistic } from "antd";

import type { SimilarPublicationVariantSummary } from "./similar-publication-variant-card.model";
import styles from "./similar-publication-form.module.css";

type Props = Readonly<{ summary: SimilarPublicationVariantSummary }>;

export function SimilarPublicationSummary({ summary }: Props) {
  const statistics = [
    { label: "Colores", value: summary.colors },
    { label: "Variantes / talles", value: summary.variants },
    { label: "Imágenes cargadas", value: summary.pictures },
    { label: "Unidades", value: summary.units },
  ];

  return (
    <section aria-label="Resumen de variantes" className={styles.variantSummary}>
      {statistics.map(({ label, value }) => (
        <Card className={styles.variantSummaryCard} key={label} size="small">
          <Statistic title={label} value={value} />
        </Card>
      ))}
    </section>
  );
}
