import styles from "./page-header.module.css";

type PageHeaderProps = Readonly<{
  description: string;
}>;

export function PageHeader({ description }: PageHeaderProps) {
  return (
    <header className={styles.header}>
      <p className={styles.description}>{description}</p>
    </header>
  );
}
