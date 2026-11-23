"use client";

import { useState } from "react";
import type { VoucherTheme } from "../lib/design";

type Choice = { id: VoucherTheme; name: string };

/** Pick the photo on the front of the voucher. Saves right away. */
export function ThemePicker({ token, locale, choices, initial, copy }: {
  token: string;
  locale: "cs" | "en";
  choices: Choice[];
  initial: VoucherTheme;
  copy: { title: string; text: string; saved: string; error: string };
}) {
  const [theme, setTheme] = useState(initial);
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");

  async function pick(next: VoucherTheme) {
    if (next === theme) return;
    const prev = theme;
    setTheme(next);
    setState("saving");
    try {
      const res = await fetch(`/api/vouchers/order/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme: next }),
      });
      if (!res.ok) throw new Error(String(res.status));
      setState("saved");
    } catch {
      setTheme(prev);
      setState("error");
    }
  }

  return (
    <section className="ed-voucher-design" aria-labelledby="voucher-design-title">
      <h2 id="voucher-design-title">{copy.title}</h2>
      <p>{copy.text}</p>
      <div className="ed-voucher-design__grid" role="radiogroup" aria-labelledby="voucher-design-title">
        {choices.map((c) => (
          <label key={c.id} className="ed-voucher-design__option" data-selected={c.id === theme || undefined}>
            <input type="radio" name="theme" value={c.id} checked={c.id === theme} onChange={() => pick(c.id)} />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/api/vouchers/design/${c.id}?locale=${locale}`} width={465} height={656} alt="" loading="lazy" />
            <span>{c.name}</span>
          </label>
        ))}
      </div>
      <p className="ed-voucher-design__status" role="status" aria-live="polite">
        {state === "saved" ? `✓ ${copy.saved}` : state === "error" ? copy.error : " "}
      </p>
    </section>
  );
}
