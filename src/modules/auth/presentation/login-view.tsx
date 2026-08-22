import { Card } from "antd";

import { PageContainer } from "@/shared/ui/page-container/page-container";

import type { LoginAction } from "./login-action-state";
import { LoginForm } from "./login-form.client";
import styles from "./login-view.module.css";

/** Vista server-first que compone la pantalla sin conocer HTTP ni cookies. */
export function LoginView({ action }: Readonly<{ action: LoginAction }>) {
  return (
    <PageContainer className={styles.page}>
      <Card className={styles.card}>
        <header className={styles.heading}>
          <h1 className={styles.title}>Iniciar sesión</h1>
          <p className={styles.description}>
            Ingresá tus credenciales para acceder al panel de gestión.
          </p>
        </header>

        <LoginForm action={action} />
      </Card>
    </PageContainer>
  );
}
