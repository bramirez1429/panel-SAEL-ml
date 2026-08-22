import { Alert, Button, Card, Tag } from "antd";

import styles from "./mercado-libre-integration-card.module.css";

type MercadoLibreIntegrationCardProps = Readonly<{
  status: "connected" | "not-connected";
}>;

/**
 * Presenta un estado ya resuelto en servidor y no inicia OAuth por su cuenta.
 * El CTA permanece inactivo hasta disponer de una conexión asociada al usuario autenticado.
 */
export function MercadoLibreIntegrationCard({
  status,
}: MercadoLibreIntegrationCardProps) {
  const isConnected = status === "connected";

  return (
    <section className={styles.section} aria-labelledby="mercado-libre-title">
      <Card
        className={styles.card}
        title={<span id="mercado-libre-title">Mercado Libre</span>}
        extra={
          <Tag color={isConnected ? "success" : "default"}>
            {isConnected ? "Conectado" : "No conectado"}
          </Tag>
        }
      >
        {isConnected ? (
          <Alert
            type="success"
            showIcon
            message="Conectado a Mercado Libre"
            description="Bienvenido al panel"
          />
        ) : (
          <div className={styles.pendingConnection}>
            <p className={styles.description}>
              La conexión todavía no está disponible para este usuario. Se
              habilitará cuando el backend pueda asociarla de forma segura con
              la sesión actual.
            </p>
            <Button type="primary" href="/api/integrations/mercado-libre/connect">
              Conectar Mercado Libre
            </Button>
          </div>
        )}
      </Card>
    </section>
  );
}
