import styles from "./dashboard.module.css";

export default function DashboardPage() {
  return (
    <section className={styles.introduction} aria-labelledby="dashboard-title">
      <h1 className={styles.title} id="dashboard-title">
        Dashboard
      </h1>
      <p className={styles.description}>Panel de gestión</p>
    </section>
  );
}
