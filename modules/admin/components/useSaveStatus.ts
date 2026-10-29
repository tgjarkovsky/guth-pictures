"use client";

import { useEffect, useRef, useState } from "react";

export type SaveStatus = "idle" | "saving" | "ok" | "error";

export function useSaveStatus() {
  const [status, setStatus] = useState<SaveStatus>("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  function reset() {
    clearTimeout(timer.current);
    setStatus("idle");
  }

  async function run(task: () => Promise<boolean>, resetMs?: number) {
    clearTimeout(timer.current);
    setStatus("saving");
    let ok = false;
    try {
      ok = await task();
    } catch {
      ok = false;
    }
    setStatus(ok ? "ok" : "error");
    if (ok && resetMs !== undefined) timer.current = setTimeout(() => setStatus("idle"), resetMs);
  }

  return { status, run, reset };
}
