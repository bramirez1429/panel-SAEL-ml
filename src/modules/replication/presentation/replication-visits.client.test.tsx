import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ReplicationVisits } from "./replication-visits.client";

describe("ReplicationVisits", () => {
  it("muestra un skeleton mientras las vistas están cargando", () => {
    const { container } = render(<ReplicationVisits />);

    expect(container.querySelector(".ant-skeleton")).toBeTruthy();
    expect(screen.queryByText("Vistas no disponibles")).not.toBeInTheDocument();
  });

  it("muestra las vistas formateadas cuando llegan", () => {
    render(<ReplicationVisits visits={1234} />);

    expect(screen.getByText("1.234 vistas")).toBeInTheDocument();
  });

  it("muestra vistas no disponibles cuando no existe el dato", () => {
    render(<ReplicationVisits visits={null} />);

    expect(screen.getByText("Vistas no disponibles")).toBeInTheDocument();
  });
});
