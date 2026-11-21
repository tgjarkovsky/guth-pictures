"use client";
import { useState } from "react";

/** The voucher card as a real object: tap to turn it over. */
export function FlipCard({ front, back, label, alt }: { front: string; back: string; label: string; alt: [string, string] }) {
  const [flipped, setFlipped] = useState(false);
  return (
    <button
      type="button"
      className="ed-gift-card"
      data-flipped={flipped || undefined}
      onClick={() => setFlipped((f) => !f)}
      aria-label={label}
      aria-pressed={flipped}
    >
      <span className="ed-gift-card__inner">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="ed-gift-card__face" src={front} width={930} height={1311} alt={alt[0]} />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="ed-gift-card__face ed-gift-card__back" src={back} width={930} height={1311} alt={alt[1]} />
      </span>
    </button>
  );
}
