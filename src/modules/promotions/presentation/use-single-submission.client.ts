"use client";

import { useCallback, useRef, useState } from "react";

export type SubmissionAttempt<T> =
  | Readonly<{ started: false }>
  | Readonly<{ started: true; value: T }>;

export function useSingleSubmission() {
  const inFlight = useRef(false);
  const [loading, setLoading] = useState(false);

  const run = useCallback(async <T>(
    operation: () => Promise<T>,
  ): Promise<SubmissionAttempt<T>> => {
    if (inFlight.current) return { started: false };
    inFlight.current = true;
    setLoading(true);
    try {
      return { started: true, value: await operation() };
    } finally {
      inFlight.current = false;
      setLoading(false);
    }
  }, []);

  return { loading, run };
}
