"use client";

import { useEffect } from "react";
import { useRouter } from "@/i18n/navigation";

/** Polls the order status and refreshes the server-rendered page once it changes. */
export function OrderStatusPoller({ token, status, sent }: { token: string; status: string; sent: boolean }) {
  const router = useRouter();
  useEffect(() => {
    const id = setInterval(async () => {
      if (document.hidden) return;
      try {
        const res = await fetch(`/api/vouchers/order/${token}`, { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (data.status !== status || data.sent !== sent) router.refresh();
      } catch {
        // offline — try again next tick
      }
    }, 20_000);
    return () => clearInterval(id);
  }, [token, status, sent, router]);
  return null;
}
