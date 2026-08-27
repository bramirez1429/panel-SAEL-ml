import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { useSingleSubmission } from "./use-single-submission.client";

describe("useSingleSubmission", () => {
  it("evita doble submit mientras una operación está en vuelo", async () => {
    let resolveOperation: (() => void) | undefined;
    const operation = new Promise<void>((resolve) => {
      resolveOperation = resolve;
    });
    const { result } = renderHook(() => useSingleSubmission());

    let first: Promise<unknown> | undefined;
    let second: Promise<unknown> | undefined;
    act(() => {
      first = result.current.run(() => operation);
      second = result.current.run(async () => undefined);
    });

    await expect(second).resolves.toEqual({ started: false });
    resolveOperation?.();
    await act(async () => {
      await first;
    });
    expect(result.current.loading).toBe(false);
  });
});
