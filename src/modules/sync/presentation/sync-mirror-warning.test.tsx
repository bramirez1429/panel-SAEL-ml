import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { MIRROR_SYNC_WARNING } from "../application/sync-progress";
import { SyncMirrorWarning } from "./sync-mirror-warning";

describe("SyncMirrorWarning", () => {
  it("muestra warning sin tratarlo como error total", () => {
    render(<SyncMirrorWarning result={{ providerUpdated: true, mirrorUpdated: false }} />);
    expect(screen.getByRole("alert")).toHaveTextContent(MIRROR_SYNC_WARNING);
    expect(screen.getByRole("alert")).toHaveClass("ant-alert-warning");
  });
});
