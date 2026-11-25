"use client";

import { useEffect } from "react";
import { useRouter } from "@/i18n/navigation";

/** Polls the order status (which also nudges the payment check) and refreshes the page once it changes. */
export function OrderStatusPoller({ token, status, sent }: { token: string; status: string; sent: boolean }) {
  const router = useRouter();
  useEffect(() => {
    const tick = async () => {
      if (document.hidden) return;
      try {
        const res = await fetch(`/api/vouchers/order/${token}`, { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (data.status !== status || data.sent !== sent) router.refresh();
      } catch {
        // offline — try again next tick
      }
    };
    const first = setTimeout(tick, 2_000); // starts a payment check right away
    const id = setInterval(tick, 20_000);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, [token, status, sent, router]);
  return null;
}
