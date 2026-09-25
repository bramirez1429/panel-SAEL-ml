import { Alert } from "antd";

import type { IntegrationEvent } from "../domain/sync.model";

export function IntegrationEventBanner({
  events,
}: Readonly<{
  events: readonly IntegrationEvent[];
}>) {
  if (!events.some((event) => event.type === "POSSIBLE_API_CHANGE" && event.count > 0)) {
    return null;
  }

  return (
    <Alert
      description="Se detectó una respuesta de Mercado Libre diferente a la esperada."
      title="Posible cambio detectado en Mercado Libre"
      showIcon
      type="warning"
    />
  );
}
