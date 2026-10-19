"use client";

import { useState } from "react";

// Base64, so the number is neither in the HTML nor greppable in the bundle; scrapers don't click.
const ENCODED = "KzQyMDcyODExMzk2Ng==";
const pretty = (phone: string) => phone.replace(/^\+420(\d{3})(\d{3})(\d{3})$/, "$1 $2 $3");

export function RevealPhone({ label }: { label: string }) {
  const [phone, setPhone] = useState<string | null>(null);
  if (phone) return <a className="ed-business-phone" href={`tel:${phone}`} autoFocus>{pretty(phone)}</a>;
  return <button type="button" className="ed-business-phone" onClick={() => setPhone(atob(ENCODED))}>{label}</button>;
}
