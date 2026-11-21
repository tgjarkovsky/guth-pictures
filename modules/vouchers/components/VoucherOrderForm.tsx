"use client";

import { useState } from "react";
import { track } from "@vercel/analytics";
import { Link, useRouter } from "@/i18n/navigation";
import type { VoucherCopy } from "../copy";
import { DEDICATION_MAX } from "../lib/validation";

export type ProductOption = { id: string; name: string; details: string[]; price: string; featured?: boolean };

type Props = {
  locale: "cs" | "en";
  products: ProductOption[];
  copy: VoucherCopy["form"];
};

const input =
  "w-full bg-[var(--color-bg-elevated)] border border-[var(--color-border)] text-[var(--color-text)] placeholder:text-[var(--color-text-ghost)] px-4 py-3 focus:outline-none focus:border-[var(--color-text-muted)] focus:ring-1 focus:ring-[var(--color-border)] transition-colors";

export function VoucherOrderForm({ locale, products, copy }: Props) {
  const router = useRouter();
  const [productId, setProductId] = useState(products[0]?.id ?? "");
  const [dedication, setDedication] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "sending" | "error">("idle");
  const [formError, setFormError] = useState("");
  const selected = products.find((p) => p.id === productId);

  const err = (field: string) =>
    errors[field] ? (
      <p id={`${field}-error`} className="mt-1 text-sm" style={{ color: "var(--color-error-fg)" }}>
        {copy.errors[errors[field] as keyof typeof copy.errors] ?? copy.errors.required}
      </p>
    ) : null;
  const aria = (field: string) => (errors[field] ? { "aria-invalid": true, "aria-describedby": `${field}-error` } : {});

  // A field's error disappears as soon as it is edited.
  function clearError(e: React.FormEvent<HTMLFormElement>) {
    const name = (e.target as HTMLInputElement).name;
    if (name && errors[name]) setErrors(({ [name]: _, ...rest }) => rest);
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("sending");
    setErrors({});
    setFormError("");
    const f = new FormData(e.currentTarget);
    const body = {
      locale,
      productId,
      buyerName: f.get("buyerName"),
      buyerEmail: f.get("buyerEmail"),
      recipientName: f.get("recipientName"),
      dedication,
      terms: f.get("terms") === "on",
      website: f.get("website"),
    };
    try {
      const res = await fetch("/api/vouchers/order", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.token) {
        track("voucher_order", { product: productId });
        router.push(`/darkovy-poukaz/objednavka/${data.token}`);
        return;
      }
      if (data.errors) setErrors(data.errors);
      setFormError(copy.errors[(data.error as keyof typeof copy.errors) ?? "generic"] ?? copy.errors.generic);
      if (data.errors && !data.errors.form) setFormError("");
      setStatus("error");
    } catch {
      setFormError(copy.errors.generic);
      setStatus("error");
    }
  }

  return (
    <form onSubmit={onSubmit} onChange={clearError} className="ed-voucher-form" noValidate>
      <fieldset>
        <legend>{copy.package}</legend>
        <div className="ed-voucher-packages">
          {products.map((p) => (
            <label key={p.id} className="ed-voucher-package" data-selected={p.id === productId || undefined} data-featured={p.featured || undefined}>
              <input type="radio" name="productId" value={p.id} checked={p.id === productId} onChange={() => setProductId(p.id)} />
              {p.featured && <span className="ed-voucher-package__badge"><span aria-hidden>♥</span> {locale === "cs" ? "Doporučuji" : "My pick"}</span>}
              <span className="ed-voucher-package__name">{p.name}</span>
              <span className="ed-voucher-package__price">{p.price}</span>
              <ul>{p.details.map((d) => <li key={d}>{d}</li>)}</ul>
            </label>
          ))}
        </div>
        {err("productId")}
      </fieldset>

      <div className="ed-voucher-form__grid">
        <div>
          <label htmlFor="v-recipient">{copy.recipientName}</label>
          <input id="v-recipient" name="recipientName" required maxLength={60} autoComplete="off" className={input} {...aria("recipientName")} />
          <p className="ed-voucher-hint">{copy.recipientNameHint}</p>
          {err("recipientName")}
        </div>
        <div>
          <label htmlFor="v-dedication">{copy.dedication}</label>
          <textarea
            id="v-dedication"
            name="dedication"
            rows={3}
            maxLength={DEDICATION_MAX}
            value={dedication}
            onChange={(e) => setDedication(e.target.value.replace(/\n/g, " "))}
            placeholder={copy.dedicationPlaceholder}
            className={`${input} resize-none`}
            {...aria("dedication")}
          />
          <p className="ed-voucher-hint" aria-live="polite">{dedication.length}/{DEDICATION_MAX}</p>
          {err("dedication")}
        </div>
        <div>
          <label htmlFor="v-buyer-name">{copy.buyerName}</label>
          <input id="v-buyer-name" name="buyerName" required maxLength={60} autoComplete="name" className={input} {...aria("buyerName")} />
          {err("buyerName")}
        </div>
        <div>
          <label htmlFor="v-buyer-email">{copy.buyerEmail}</label>
          <input id="v-buyer-email" name="buyerEmail" type="email" required autoComplete="email" className={input} {...aria("buyerEmail")} />
          <p className="ed-voucher-hint">{copy.buyerEmailHint}</p>
          {err("buyerEmail")}
        </div>
      </div>

      {/* Honeypot — hidden from people, bots fill it in */}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="ed-voucher-hp" />

      <label className="ed-voucher-check">
        <input type="checkbox" name="terms" required {...aria("terms")} />
        <span>
          {renderTerms(copy.terms)}
        </span>
      </label>
      {err("terms")}

      <div className="ed-voucher-form__submit">
        {selected && (
          <p>
            <span>{copy.total}</span> <strong>{selected.price}</strong>
          </p>
        )}
        <button type="submit" disabled={status === "sending"} className="px-6 py-3 bg-[var(--color-text)] text-[var(--color-bg)] font-medium hover:opacity-85 transition-opacity disabled:opacity-50">
          {status === "sending" ? copy.submitting : copy.submit}
        </button>
      </div>
      {formError && (
        <div role="alert" className="p-4 text-sm" style={{ background: "var(--color-error-bg)", border: "1px solid var(--color-error-border)", color: "var(--color-error-fg)" }}>
          {formError}
        </div>
      )}
    </form>
  );
}

/** "<link>…</link>" and "<privacy>…</privacy>" placeholders → links. */
function renderTerms(text: string) {
  const parts = text.split(/(<link>.*?<\/link>|<privacy>.*?<\/privacy>)/);
  return parts.map((part, i) => {
    const link = part.match(/^<link>(.*)<\/link>$/);
    if (link) return <Link key={i} href="/vop#poukazy" target="_blank" className="underline">{link[1]}</Link>;
    const privacy = part.match(/^<privacy>(.*)<\/privacy>$/);
    if (privacy) return <Link key={i} href="/privacy" target="_blank" className="underline">{privacy[1]}</Link>;
    return part;
  });
}
