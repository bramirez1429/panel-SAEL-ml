import type { BackendStatus } from "../domain/backend-status.model";
import styles from "./backend-status-view.module.css";

type BackendStatusViewProps = Readonly<{
  status: BackendStatus | null;
}>;

export function BackendStatusView({ status }: BackendStatusViewProps) {
  const state = status?.state ?? "unavailable";

  return (
    <section
      className={styles.statusCard}
      aria-labelledby="backend-status-title"
      data-state={state}
    >
      <span
        className={`${styles.statusIndicator} ${
          status ? "" : styles.statusIndicatorUnavailable
        }`}
        aria-hidden="true"
      />
      <div>
        <h2 className={styles.title} id="backend-status-title">
          Estado del backend
        </h2>
        <p className={styles.description}>
          {status ? "Conectado" : "No disponible"}
        </p>
      </div>
    </section>
  );
}
