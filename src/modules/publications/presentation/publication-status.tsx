import { Tag } from "antd";

type PublicationStatusProps = Readonly<{ status: string | null }>;

const statusLabels: Readonly<Record<string, string>> = {
  active: "Activa",
  paused: "Pausada",
  closed: "Finalizada",
  under_review: "En revisión",
  inactive: "Inactiva",
};

const statusColors: Readonly<Record<string, string>> = {
  active: "success",
  paused: "warning",
  closed: "error",
  under_review: "processing",
  inactive: "default",
};

/** Presenta códigos reales del backend con etiquetas amigables sin alterar el dominio. */
export function PublicationStatus({ status }: PublicationStatusProps) {
  if (!status) {
    return <span title="Dato no disponible">—</span>;
  }

  return (
    <Tag color={statusColors[status]}>
      {statusLabels[status] ?? humanizeStatus(status)}
    </Tag>
  );
}

function humanizeStatus(status: string): string {
  return status
    .split(/[_-]+/u)
    .filter(Boolean)
    .map((word) => `${word[0]?.toLocaleUpperCase("es")}${word.slice(1)}`)
    .join(" ");
}
