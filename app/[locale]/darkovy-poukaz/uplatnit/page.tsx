import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ContactForm } from "@/components/ContactForm";
import { EditorialSubpage } from "@/modules/editorial/components/EditorialSubpage";
import { getVoucherCopy } from "@/modules/vouchers/copy";
import { normalizeVoucherCode } from "@/modules/vouchers/lib/code";
import { formatDate, pragueDate } from "@/modules/vouchers/lib/dates";
import { findOrderByCode } from "@/modules/vouchers/lib/store";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return { title: getVoucherCopy(locale).redeem.title, robots: { index: false } };
}

export default async function RedeemPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ kod?: string }> }) {
  const { locale: raw } = await params;
  const locale = raw === "en" ? "en" : "cs";
  const t = getVoucherCopy(locale).redeem;
  const input = (await searchParams).kod ?? "";
  const code = input ? normalizeVoucherCode(input) : null;
  // Canonical code in the URL — the contact form below copies it into the message.
  if (code && code !== input) redirect(`/${locale}/darkovy-poukaz/uplatnit?kod=${code}`);
  const order = code ? await findOrderByCode(code).catch(() => null) : null;

  let state: "none" | "valid" | "redeemed" | "expired" | "notFound" = "none";
  if (input) {
    if (!order || order.status === "pending" || order.status === "cancelled") state = "notFound";
    else if (order.status === "redeemed") state = "redeemed";
    else if (order.validUntil && order.validUntil < pragueDate()) state = "expired";
    else state = "valid";
  }

  return (
    <EditorialSubpage active="voucher" className="ed-voucher">
      <section className="ed-voucher-pay">
        <h1>{t.title}</h1>
        <p className="ed-voucher-pay__lead">{t.subtitle}</p>
        <form method="get" className="ed-voucher-redeem">
          <label htmlFor="kod">{t.code}</label>
          <div>
            <input id="kod" name="kod" defaultValue={code ?? input} placeholder="GP-XXXX-XXXX" autoComplete="off" autoCapitalize="characters" spellCheck={false} />
            <button type="submit">{t.check}</button>
          </div>
        </form>
        {state === "valid" && order && (
          <div className="ed-voucher-result" data-state="ok" role="status">
            <strong>✓ {t.valid}</strong>
            <p>{order.product.name} · {order.recipient.name} · {t.validUntil} {formatDate(order.validUntil!, locale)}</p>
          </div>
        )}
        {state === "redeemed" && <div className="ed-voucher-result" role="status">{t.redeemed}</div>}
        {state === "expired" && <div className="ed-voucher-result" role="status">{t.expired}</div>}
        {state === "notFound" && <div className="ed-voucher-result" data-state="error" role="status">{t.notFound}</div>}
      </section>
      {(state === "valid" || state === "expired") && (
        <section id="kontakt" className="ed-secondary-contact">
          <h2>{t.contactTitle}</h2>
          <ContactForm />
        </section>
      )}
    </EditorialSubpage>
  );
}
