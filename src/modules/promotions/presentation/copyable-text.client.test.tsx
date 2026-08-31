import { message } from "antd";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { CopyableText } from "./copyable-text.client";

const writeText = vi.fn();

describe("CopyableText", () => {
  beforeEach(() => {
    writeText.mockReset();
    writeText.mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });
    vi.spyOn(message, "success");
  });
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it.each([
    ["MLA1947917494", "MLA", "MLA copiado"],
    ["123456789", "familia", "Familia copiada"],
  ])("copia %s sin propagar acciones de fila", async (value, copyLabel, successMessage) => {
    const parentClick = vi.fn();
    render(<div onClick={parentClick}><CopyableText value={value} label={value} copyLabel={copyLabel} successMessage={successMessage} /></div>);

    fireEvent.click(screen.getByRole("button", { name: `Copiar ${copyLabel} ${value}` }));

    await waitFor(() => expect(writeText).toHaveBeenCalledWith(value));
    expect(message.success).toHaveBeenCalledWith(successMessage);
    expect(parentClick).not.toHaveBeenCalled();
  });
});
