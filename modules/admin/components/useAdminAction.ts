"use client";

import { useState } from "react";

interface RunOptions {
  onSuccess?: (data: any) => string | void;
  onError?: (message: string) => void;
  fallbackError?: string;
  keepBusyOnSuccess?: boolean;
}

export const errorMessage = (e: unknown) => `Chyba: ${e instanceof Error ? e.message : "Unknown"}`;

export const messageClass = (message: string) => (message.startsWith("Chyba") ? "text-red-400" : "text-green-400");

export function useAdminAction() {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function run(url: string, init: RequestInit, { onSuccess, onError, fallbackError = "Failed", keepBusyOnSuccess }: RunOptions = {}) {
    setBusy(true);
    setMessage(null);
    let failed = false;
    try {
      const res = await fetch(url, init);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? fallbackError);
      const text = onSuccess?.(data);
      if (text) setMessage(text);
    } catch (e) {
      failed = true;
      (onError ?? setMessage)(errorMessage(e));
    } finally {
      if (failed || !keepBusyOnSuccess) setBusy(false);
    }
  }

  return { busy, message, run };
}
