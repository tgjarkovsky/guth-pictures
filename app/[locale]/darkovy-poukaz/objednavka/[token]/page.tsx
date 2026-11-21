import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EditorialSubpage } from "@/modules/editorial/components/EditorialSubpage";
import { getVoucherCopy } from "@/modules/vouchers/copy";
import { OrderStatusPoller } from "@/modules/vouchers/components/OrderStatusPoller";
import { voucherConfig } from "@/modules/vouchers/lib/config";
import { formatCzk, formatDate } from "@/modules/vouchers/lib/dates";
import { qrDataUri } from "@/modules/vouchers/lib/render";
import { giftUrl, orderIdFromToken } from "@/modules/vouchers/lib/service";
import { spayd } from "@/modules/vouchers/lib/spayd";
import { getOrder } from "@/modules/vouchers/lib/store";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function OrderPage({ params }: { params: Promise<{ locale: string; token: string }> }) {
  const { locale: raw, token } = await params;
  const locale = raw === "en" ? "en" : "cs";
  const t = getVoucherCopy(locale).order;
  const id = await orderIdFromToken(token);
  const order = id ? await getOrder(id) : null;
  if (!order) notFound();

  const c = voucherConfig();
  const amount = formatCzk(order.product.priceCzk, locale);
  const message = `${locale === "cs" ? "Darkovy poukaz" : "Gift voucher"} ${order.vs}`;
  const qr = order.status === "pending"
    ? await qrDataUri(spayd({ iban: c.iban, amount: order.product.priceCzk, vs: order.vs, message, recipient: c.payeeName }), "#11100e", "#ffffff")
    : null;
  const issued = order.status === "paid" || order.status === "redeemed";
  const gift = issued ? await giftUrl(order) : null;
  const g = getVoucherCopy(locale).gift;

  return (
    <EditorialSubpage active="voucher" className="ed-voucher">
      <section className="ed-voucher-pay">
        <p className="ed-voucher-kicker">{t.title} · VS {order.vs}</p>

        {order.status === "pending" && qr && (
          <>
            <h1>{t.pendingTitle}</h1>
            <p className="ed-voucher-pay__lead">{t.pendingText}</p>
            <div className="ed-voucher-pay__grid">
              <figure className="ed-voucher-qr">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={qr} width={260} height={260} alt="QR platba" />
                <figcaption>QR platba</figcaption>
              </figure>
              <dl className="ed-voucher-dl">
                <div><dt>{t.amount}</dt><dd><strong>{amount}</strong></dd></div>
                <div><dt>{t.account}</dt><dd>{c.accountLabel}</dd></div>
                <div><dt>IBAN</dt><dd>{c.iban}</dd></div>
                <div><dt>{t.vs}</dt><dd><strong>{order.vs}</strong></dd></div>
                <div><dt>{t.message}</dt><dd>{message}</dd></div>
              </dl>
            </div>
            <p className="ed-voucher-waiting" role="status"><span aria-hidden className="ed-voucher-dot" />{t.waiting}</p>
          </>
        )}

        {issued && (
          <>
            <h1>{t.paidTitle}</h1>
            <p className="ed-voucher-pay__lead">{order.sentToBuyerAt ? t.paidText : t.paidPreparing}</p>
            <div className="ed-voucher-actions">
              <a href={`/api/vouchers/order/${token}/pdf`} className="ed-voucher-cta">{t.download}</a>
              {order.invoiceNumber && (
                <a href={`/api/vouchers/order/${token}/pdf?doc=invoice`} className="ed-voucher-link">{t.invoice} {order.invoiceNumber}</a>
              )}
            </div>
            {gift && (
              <div className="ed-voucher-share">
                <h2>{g.share}</h2>
                <p>{g.shareText}</p>
                <input readOnly value={gift} aria-label={g.share} />
                <p style={{ marginTop: ".75rem" }}><a href={gift} className="ed-voucher-link">{locale === "cs" ? "Otevřít kartu poukazu" : "Open the voucher card"}</a></p>
              </div>
            )}
          </>
        )}

        {order.status === "expired" && (
          <>
            <h1>{t.expiredTitle}</h1>
            <p className="ed-voucher-pay__lead">{t.expiredText} <a href={`mailto:${c.replyTo}`} className="underline">{c.replyTo}</a></p>
          </>
        )}
        {order.status === "cancelled" && <h1>{t.cancelledTitle}</h1>}

        <div className="ed-voucher-summary">
          <h2>{t.summary}</h2>
          <p><strong>{order.product.name}</strong> — {amount}</p>
          <p>{order.product.details.join(" · ")}</p>
          <p>{t.for}: {order.recipient.name}{order.dedication ? ` — „${order.dedication}“` : ""}</p>
          {order.code && order.validUntil && <p>{order.code} · {formatDate(order.validUntil, locale)}</p>}
        </div>
      </section>
      {(order.status === "pending" || (issued && !order.sentToBuyerAt)) && (
        <OrderStatusPoller token={token} status={order.status} sent={Boolean(order.sentToBuyerAt)} />
      )}
    </EditorialSubpage>
  );
}
